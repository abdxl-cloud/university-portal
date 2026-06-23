// Package library is the Postgres-backed library domain and the reference
// implementation of the project's data-access conventions:
//   - shared db.Conn / db.InTx helpers (no per-domain transaction plumbing)
//   - canonical apperr errors (mapped to HTTP by the respond package)
//   - db.Translate for low-level pgx error classification
//   - list methods return (items, total) for the standard paginated envelope
//
// New domains added during the persistence port should mirror this file.
package library

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"formbuilder/backend/internal/apperr"
	"formbuilder/backend/internal/db"
	"formbuilder/backend/internal/portal"
)

// Repo is the Postgres-backed library store. It reproduces the loan rules from
// internal/portal/actions.go (14-day due date, decrement/increment available,
// unavailable when none available, audit every action).
type Repo struct {
	pool *pgxpool.Pool
}

func NewRepo(pool *pgxpool.Pool) *Repo {
	return &Repo{pool: pool}
}

// Student is the minimal identity returned by the public verify endpoint.
type Student struct {
	ID        string `json:"id"`
	MatricNo  string `json:"matricNo"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

// BookInput is the payload for cataloguing a scanned book.
type BookInput struct {
	Title    string
	Author   string
	Category string
	Year     int
	CallNo   string
	ISBN     string
	Copies   int
}

const bookCols = `id::text, title, author, category, COALESCE(publication_year,0), call_no, COALESCE(isbn,''), copies, available`
const loanCols = `id::text, book_id::text, student_id::text, due_at, status, fine_kobo, currency`

func scanBook(row pgx.Row) (portal.LibraryBook, error) {
	var b portal.LibraryBook
	err := row.Scan(&b.ID, &b.Title, &b.Author, &b.Category, &b.Year, &b.CallNo, &b.ISBN, &b.Copies, &b.Available)
	return b, err
}

func scanLoan(row pgx.Row) (portal.LibraryLoan, error) {
	var loan portal.LibraryLoan
	var fineKobo int64
	var currency string
	if err := row.Scan(&loan.ID, &loan.BookID, &loan.StudentID, &loan.DueAt, &loan.Status, &fineKobo, &currency); err != nil {
		return portal.LibraryLoan{}, err
	}
	loan.Fine = portal.Money{Amount: fineKobo, Currency: currency}
	return loan, nil
}

// --- reads (paginated: return items + total) ---

func (r *Repo) ListBooks(ctx context.Context, limit, offset int) ([]portal.LibraryBook, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM library_books`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `SELECT `+bookCols+` FROM library_books ORDER BY title LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.LibraryBook{}
	for rows.Next() {
		b, err := scanBook(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, b)
	}
	return out, total, rows.Err()
}

func (r *Repo) ListLoans(ctx context.Context, limit, offset int) ([]portal.LibraryLoan, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM library_loans`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `SELECT `+loanCols+` FROM library_loans ORDER BY due_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.LibraryLoan{}
	for rows.Next() {
		loan, err := scanLoan(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, loan)
	}
	return out, total, rows.Err()
}

func (r *Repo) ListReservations(ctx context.Context, limit, offset int) ([]portal.LibraryReservation, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM library_reservations`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `SELECT id::text, book_id::text, student_id::text, status, created_at FROM library_reservations ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []portal.LibraryReservation{}
	for rows.Next() {
		var res portal.LibraryReservation
		if err := rows.Scan(&res.ID, &res.BookID, &res.StudentID, &res.Status, &res.CreatedAt); err != nil {
			return nil, 0, err
		}
		out = append(out, res)
	}
	return out, total, rows.Err()
}

// --- intake / lookup ---

func (r *Repo) CreateBook(ctx context.Context, in BookInput, actorUserID string) (portal.LibraryBook, error) {
	if in.Title == "" || in.Author == "" {
		return portal.LibraryBook{}, apperr.Invalid("title and author are required")
	}
	if in.Copies < 1 {
		in.Copies = 1
	}
	callNo := in.CallNo
	if callNo == "" {
		if in.ISBN != "" {
			callNo = "ISBN-" + in.ISBN
		} else {
			callNo = "CALL-" + newID()
		}
	}
	var isbn, year any
	if in.ISBN != "" {
		isbn = in.ISBN
	}
	if in.Year != 0 {
		year = in.Year
	}

	book, err := scanBook(r.pool.QueryRow(ctx, `
		INSERT INTO library_books (title, author, category, publication_year, call_no, copies, available, isbn)
		VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
		RETURNING `+bookCols,
		in.Title, in.Author, in.Category, year, callNo, in.Copies, isbn))
	if err != nil {
		return portal.LibraryBook{}, db.Translate(err)
	}
	r.audit(ctx, r.pool, actorUserID, "catalogued", "library-book", book.ID, map[string]any{"isbn": in.ISBN})
	return book, nil
}

func (r *Repo) LookupLocalByISBN(ctx context.Context, isbn string) (portal.LibraryBook, bool, error) {
	book, err := scanBook(r.pool.QueryRow(ctx, `SELECT `+bookCols+` FROM library_books WHERE isbn=$1`, isbn))
	if db.IsNotFound(err) {
		return portal.LibraryBook{}, false, nil
	}
	if err != nil {
		return portal.LibraryBook{}, false, err
	}
	return book, true, nil
}

func (r *Repo) StudentByMatric(ctx context.Context, matric string) (Student, error) {
	var s Student
	err := r.pool.QueryRow(ctx, `SELECT id::text, matric_no, first_name, last_name FROM students WHERE matric_no=$1`, matric).
		Scan(&s.ID, &s.MatricNo, &s.FirstName, &s.LastName)
	if db.IsNotFound(err) {
		return Student{}, apperr.NotFound("student not found")
	}
	if err != nil {
		return Student{}, err
	}
	return s, nil
}

// --- mutations ---

func (r *Repo) BorrowByID(ctx context.Context, studentID, bookID, actorUserID string) (portal.LibraryLoan, error) {
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.LibraryLoan, error) {
		return r.borrow(ctx, tx, studentID, bookID, actorUserID, nil)
	})
}

// ScanCheckout issues a loan from a scanned student matric + book ISBN, made
// idempotent on eventID so a re-sent offline scan cannot create a duplicate.
func (r *Repo) ScanCheckout(ctx context.Context, matric, isbn, eventID, actorUserID string) (portal.LibraryLoan, error) {
	if matric == "" || isbn == "" {
		return portal.LibraryLoan{}, apperr.Invalid("student code and ISBN are required")
	}
	if eventID == "" {
		eventID = newID()
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.LibraryLoan, error) {
		prior, fresh, err := r.reserveEvent(ctx, tx, eventID, "checkout")
		if err != nil {
			return portal.LibraryLoan{}, err
		}
		if !fresh {
			if prior != nil {
				return r.loanByID(ctx, tx, *prior)
			}
			return portal.LibraryLoan{}, apperr.Conflict("duplicate scan in progress")
		}

		var studentID string
		err = tx.QueryRow(ctx, `SELECT id::text FROM students WHERE matric_no=$1`, matric).Scan(&studentID)
		if db.IsNotFound(err) {
			return portal.LibraryLoan{}, apperr.NotFound("student not found")
		}
		if err != nil {
			return portal.LibraryLoan{}, err
		}

		var bookID string
		err = tx.QueryRow(ctx, `SELECT id::text FROM library_books WHERE isbn=$1`, isbn).Scan(&bookID)
		if db.IsNotFound(err) {
			return portal.LibraryLoan{}, apperr.NotFound("book not found for that ISBN")
		}
		if err != nil {
			return portal.LibraryLoan{}, err
		}

		loan, err := r.borrow(ctx, tx, studentID, bookID, actorUserID, map[string]any{"matric": matric, "isbn": isbn, "eventId": eventID, "via": "scan"})
		if err != nil {
			return portal.LibraryLoan{}, err
		}
		if _, err := tx.Exec(ctx, `UPDATE scan_events SET result_id=$1 WHERE event_id=$2`, loan.ID, eventID); err != nil {
			return portal.LibraryLoan{}, err
		}
		return loan, nil
	})
}

func (r *Repo) ReturnByID(ctx context.Context, loanID, actorUserID string) (portal.LibraryLoan, error) {
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.LibraryLoan, error) {
		return r.returnLoan(ctx, tx, loanID, actorUserID, nil)
	})
}

func (r *Repo) ScanReturn(ctx context.Context, isbn, eventID, actorUserID string) (portal.LibraryLoan, error) {
	if isbn == "" {
		return portal.LibraryLoan{}, apperr.Invalid("ISBN is required")
	}
	if eventID == "" {
		eventID = newID()
	}
	return db.InTx(ctx, r.pool, func(tx pgx.Tx) (portal.LibraryLoan, error) {
		prior, fresh, err := r.reserveEvent(ctx, tx, eventID, "return")
		if err != nil {
			return portal.LibraryLoan{}, err
		}
		if !fresh {
			if prior != nil {
				return r.loanByID(ctx, tx, *prior)
			}
			return portal.LibraryLoan{}, apperr.Conflict("duplicate scan in progress")
		}

		var loanID string
		err = tx.QueryRow(ctx, `
			SELECT l.id::text FROM library_loans l
			JOIN library_books b ON b.id = l.book_id
			WHERE b.isbn = $1 AND l.status = 'on-loan'
			ORDER BY l.due_at LIMIT 1
			FOR UPDATE OF l`, isbn).Scan(&loanID)
		if db.IsNotFound(err) {
			return portal.LibraryLoan{}, apperr.NotFound("no active loan for that ISBN")
		}
		if err != nil {
			return portal.LibraryLoan{}, err
		}

		loan, err := r.returnLoan(ctx, tx, loanID, actorUserID, map[string]any{"isbn": isbn, "eventId": eventID, "via": "scan"})
		if err != nil {
			return portal.LibraryLoan{}, err
		}
		if _, err := tx.Exec(ctx, `UPDATE scan_events SET result_id=$1 WHERE event_id=$2`, loan.ID, eventID); err != nil {
			return portal.LibraryLoan{}, err
		}
		return loan, nil
	})
}

func (r *Repo) ReserveByID(ctx context.Context, studentID, bookID, actorUserID string) (portal.LibraryReservation, error) {
	if err := r.requireExists(ctx, `SELECT 1 FROM library_books WHERE id=$1::uuid`, bookID, "book not found"); err != nil {
		return portal.LibraryReservation{}, err
	}
	if err := r.requireExists(ctx, `SELECT 1 FROM students WHERE id=$1::uuid`, studentID, "student not found"); err != nil {
		return portal.LibraryReservation{}, err
	}
	var res portal.LibraryReservation
	err := r.pool.QueryRow(ctx, `
		INSERT INTO library_reservations (book_id, student_id, status)
		VALUES ($1::uuid, $2::uuid, 'waiting')
		RETURNING id::text, book_id::text, student_id::text, status, created_at`, bookID, studentID).
		Scan(&res.ID, &res.BookID, &res.StudentID, &res.Status, &res.CreatedAt)
	if err != nil {
		return portal.LibraryReservation{}, db.Translate(err)
	}
	r.audit(ctx, r.pool, actorUserID, "reserved", "library-book", bookID, nil)
	return res, nil
}

// --- internal helpers ---

func (r *Repo) borrow(ctx context.Context, tx pgx.Tx, studentID, bookID, actorUserID string, extra map[string]any) (portal.LibraryLoan, error) {
	var available int
	err := tx.QueryRow(ctx, `SELECT available FROM library_books WHERE id=$1::uuid FOR UPDATE`, bookID).Scan(&available)
	if db.IsNotFound(err) {
		return portal.LibraryLoan{}, apperr.NotFound("book not found")
	}
	if err != nil {
		return portal.LibraryLoan{}, err
	}
	if available < 1 {
		return portal.LibraryLoan{}, apperr.Unavailable("no copies available")
	}
	if err := r.requireExists(ctx, `SELECT 1 FROM students WHERE id=$1::uuid`, studentID, "student not found"); err != nil {
		return portal.LibraryLoan{}, err
	}
	if _, err := tx.Exec(ctx, `UPDATE library_books SET available=available-1 WHERE id=$1::uuid`, bookID); err != nil {
		return portal.LibraryLoan{}, err
	}
	var loanID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO library_loans (book_id, student_id, due_at, status, fine_kobo, currency)
		VALUES ($1::uuid, $2::uuid, now() + interval '14 days', 'on-loan', 0, 'NGN')
		RETURNING id::text`, bookID, studentID).Scan(&loanID); err != nil {
		return portal.LibraryLoan{}, err
	}
	r.audit(ctx, tx, actorUserID, "borrowed", "library-book", bookID, extra)
	return r.loanByID(ctx, tx, loanID)
}

func (r *Repo) returnLoan(ctx context.Context, tx pgx.Tx, loanID, actorUserID string, extra map[string]any) (portal.LibraryLoan, error) {
	var bookID, status string
	err := tx.QueryRow(ctx, `SELECT book_id::text, status FROM library_loans WHERE id=$1::uuid FOR UPDATE`, loanID).Scan(&bookID, &status)
	if db.IsNotFound(err) {
		return portal.LibraryLoan{}, apperr.NotFound("loan not found")
	}
	if err != nil {
		return portal.LibraryLoan{}, err
	}
	if status != "returned" {
		if _, err := tx.Exec(ctx, `UPDATE library_loans SET status='returned' WHERE id=$1::uuid`, loanID); err != nil {
			return portal.LibraryLoan{}, err
		}
		if _, err := tx.Exec(ctx, `UPDATE library_books SET available=available+1 WHERE id=$1::uuid`, bookID); err != nil {
			return portal.LibraryLoan{}, err
		}
		r.audit(ctx, tx, actorUserID, "returned", "library-loan", loanID, extra)
	}
	return r.loanByID(ctx, tx, loanID)
}

func (r *Repo) loanByID(ctx context.Context, q db.Conn, id string) (portal.LibraryLoan, error) {
	loan, err := scanLoan(q.QueryRow(ctx, `SELECT `+loanCols+` FROM library_loans WHERE id=$1::uuid`, id))
	if db.IsNotFound(err) {
		return portal.LibraryLoan{}, apperr.NotFound("loan not found")
	}
	return loan, err
}

// reserveEvent records a scan's event_id once. fresh=true means this is the
// first time we have seen it; otherwise prior holds the previously stored result.
func (r *Repo) reserveEvent(ctx context.Context, tx pgx.Tx, eventID, kind string) (prior *string, fresh bool, err error) {
	ct, err := tx.Exec(ctx, `INSERT INTO scan_events (event_id, kind) VALUES ($1, $2) ON CONFLICT (event_id) DO NOTHING`, eventID, kind)
	if err != nil {
		return nil, false, err
	}
	if ct.RowsAffected() == 1 {
		return nil, true, nil
	}
	if err := tx.QueryRow(ctx, `SELECT result_id FROM scan_events WHERE event_id=$1`, eventID).Scan(&prior); err != nil {
		return nil, false, err
	}
	return prior, false, nil
}

func (r *Repo) requireExists(ctx context.Context, query, id, notFoundMsg string) error {
	err := r.pool.QueryRow(ctx, query, id).Scan(new(int))
	if db.IsNotFound(err) {
		return apperr.NotFound(notFoundMsg)
	}
	return err
}

func (r *Repo) audit(ctx context.Context, q db.Conn, actorUserID, action, entityType, entityID string, extra map[string]any) {
	if extra == nil {
		extra = map[string]any{}
	}
	payload, err := json.Marshal(extra)
	if err != nil {
		return
	}
	var actor any
	if actorUserID != "" {
		actor = actorUserID // real users.id UUID of the acting staff/student
	}
	// Audit failures must not abort the surrounding operation.
	_, _ = q.Exec(ctx, `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1::uuid, $2, $3, $4, $5::jsonb)`,
		actor, action, entityType, entityID, string(payload))
}

func newID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
