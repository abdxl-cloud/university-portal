package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"formbuilder/backend/internal/apperr"
	"formbuilder/backend/internal/httpapi/respond"
	"formbuilder/backend/internal/library"
)

type createBookRequest struct {
	Title    string `json:"title"`
	Author   string `json:"author"`
	Category string `json:"category"`
	Year     int    `json:"year"`
	CallNo   string `json:"callNo"`
	ISBN     string `json:"isbn"`
	Copies   int    `json:"copies"`
}

func (req createBookRequest) Validate() error {
	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Author) == "" {
		return apperr.Invalid("title and author are required")
	}
	return nil
}

type scanCheckoutRequest struct {
	StudentToken string `json:"studentToken"`
	ISBN         string `json:"isbn"`
	EventID      string `json:"eventId"`
}

func (req scanCheckoutRequest) Validate() error {
	if strings.TrimSpace(req.StudentToken) == "" {
		return apperr.Invalid("studentToken is required")
	}
	if strings.TrimSpace(req.ISBN) == "" {
		return apperr.Invalid("isbn is required")
	}
	return nil
}

type scanReturnRequest struct {
	ISBN    string `json:"isbn"`
	EventID string `json:"eventId"`
}

func (req scanReturnRequest) Validate() error {
	if strings.TrimSpace(req.ISBN) == "" {
		return apperr.Invalid("isbn is required")
	}
	return nil
}

// --- read endpoints (Postgres-backed, paginated) ---

func (a *API) libraryBooks(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireUser(w, r); !ok {
		return
	}
	page := parsePage(r)
	books, total, err := a.library.ListBooks(r.Context(), page.Limit, page.Offset)
	if err != nil {
		a.logger.Error("list books", "error", err)
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, books, page)
}

func (a *API) libraryLoans(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	if user.Role != "student" && !hasRole(user, "librarian", "ict") {
		respond.Error(w, http.StatusForbidden, "forbidden for role")
		return
	}
	scope, ok := a.studentScope(w, r, user)
	if !ok {
		return
	}
	page := parsePage(r)
	loans, total, err := a.library.ListLoans(r.Context(), page.Limit, page.Offset, scope)
	if err != nil {
		a.logger.Error("list loans", "error", err)
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, loans, page)
}

func (a *API) libraryReservations(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	if user.Role != "student" && !hasRole(user, "librarian", "ict") {
		respond.Error(w, http.StatusForbidden, "forbidden for role")
		return
	}
	scope, ok := a.studentScope(w, r, user)
	if !ok {
		return
	}
	page := parsePage(r)
	reservations, total, err := a.library.ListReservations(r.Context(), page.Limit, page.Offset, scope)
	if err != nil {
		a.logger.Error("list reservations", "error", err)
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, reservations, page)
}

// --- existing mutations (Postgres-backed) ---

func (a *API) borrowBook(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "librarian", "ict")
	if !ok {
		return
	}
	var req libraryBookRequest
	if !bind(w, r, &req) {
		return
	}
	studentID, ok := a.targetStudentID(w, r, user, req.StudentID)
	if !ok {
		return
	}
	loan, err := a.library.BorrowByID(r.Context(), studentID, req.BookID, user.ID)
	writeMutation(w, err, map[string]any{"loan": loan})
}

func (a *API) reserveBook(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "librarian", "ict")
	if !ok {
		return
	}
	var req libraryBookRequest
	if !bind(w, r, &req) {
		return
	}
	studentID, ok := a.targetStudentID(w, r, user, req.StudentID)
	if !ok {
		return
	}
	reservation, err := a.library.ReserveByID(r.Context(), studentID, req.BookID, user.ID)
	writeMutation(w, err, map[string]any{"reservation": reservation})
}

func (a *API) returnLoan(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "student", "librarian", "ict")
	if !ok {
		return
	}
	var req idRequest
	if !bind(w, r, &req) {
		return
	}
	scope, ok := a.studentScope(w, r, user)
	if !ok {
		return
	}
	loan, err := a.library.ReturnByID(r.Context(), req.ID, user.ID, scope)
	writeMutation(w, err, map[string]any{"loan": loan})
}

// --- scan / intake endpoints ---

func (a *API) createBook(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "librarian", "ict")
	if !ok {
		return
	}
	var req createBookRequest
	if !bind(w, r, &req) {
		return
	}
	book, err := a.library.CreateBook(r.Context(), library.BookInput{
		Title:    strings.TrimSpace(req.Title),
		Author:   strings.TrimSpace(req.Author),
		Category: strings.TrimSpace(req.Category),
		Year:     req.Year,
		CallNo:   strings.TrimSpace(req.CallNo),
		ISBN:     strings.TrimSpace(req.ISBN),
		Copies:   req.Copies,
	}, user.ID)
	writeMutation(w, err, map[string]any{"book": book})
}

// lookupBook returns the catalogued book for an ISBN (offline path), or, when
// online, a metadata suggestion from OpenLibrary to pre-fill the intake form.
func (a *API) lookupBook(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireRole(w, r, "librarian", "ict"); !ok {
		return
	}
	isbn := strings.TrimSpace(r.URL.Query().Get("isbn"))
	if isbn == "" {
		respond.Err(w, apperr.Invalid("isbn is required"))
		return
	}

	book, found, err := a.library.LookupLocalByISBN(r.Context(), isbn)
	if err != nil {
		a.logger.Error("lookup book", "error", err)
		respond.Err(w, err)
		return
	}
	if found {
		respond.JSON(w, http.StatusOK, map[string]any{"source": "catalogue", "book": book})
		return
	}

	if suggestion, ok := lookupOpenLibrary(r.Context(), isbn); ok {
		respond.JSON(w, http.StatusOK, map[string]any{"source": "openlibrary", "suggestion": suggestion})
		return
	}
	// Offline or unknown ISBN: tell the client to enter details manually.
	respond.JSON(w, http.StatusOK, map[string]any{"source": "none", "isbn": isbn})
}

func (a *API) scanCheckout(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "librarian", "ict")
	if !ok {
		return
	}
	var req scanCheckoutRequest
	if !bind(w, r, &req) {
		return
	}
	matric, err := a.ident.Verify(req.StudentToken)
	if err != nil {
		respond.Err(w, apperr.Invalid("invalid or unverifiable student code"))
		return
	}
	loan, err := a.library.ScanCheckout(r.Context(), matric, strings.TrimSpace(req.ISBN), strings.TrimSpace(req.EventID), user.ID)
	writeMutation(w, err, map[string]any{"loan": loan})
}

func (a *API) scanReturn(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, "librarian", "ict")
	if !ok {
		return
	}
	var req scanReturnRequest
	if !bind(w, r, &req) {
		return
	}
	loan, err := a.library.ScanReturn(r.Context(), strings.TrimSpace(req.ISBN), strings.TrimSpace(req.EventID), user.ID)
	writeMutation(w, err, map[string]any{"loan": loan})
}

// --- identity / verification ---

func (a *API) identityQR(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	token, err := a.ident.Sign(user.Identifier)
	if err != nil {
		respond.Err(w, err)
		return
	}
	respond.JSON(w, http.StatusOK, map[string]any{"token": token, "payload": user.Identifier})
}

func (a *API) verifyToken(w http.ResponseWriter, r *http.Request) {
	payload, err := a.ident.Verify(r.PathValue("token"))
	if err != nil {
		respond.JSON(w, http.StatusOK, map[string]any{"valid": false})
		return
	}
	resp := map[string]any{"valid": true, "payload": payload}
	if student, err := a.library.StudentByMatric(r.Context(), payload); err == nil {
		resp["student"] = student
	}
	respond.JSON(w, http.StatusOK, resp)
}

// --- OpenLibrary metadata (online enhancement, offline-safe) ---

var yearPattern = regexp.MustCompile(`\d{4}`)

func lookupOpenLibrary(ctx context.Context, isbn string) (map[string]any, bool) {
	ctx, cancel := context.WithTimeout(ctx, 4*time.Second)
	defer cancel()

	url := "https://openlibrary.org/api/books?bibkeys=ISBN:" + isbn + "&format=json&jscmd=data"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, false
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, false
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, false
	}

	var data map[string]struct {
		Title   string `json:"title"`
		Authors []struct {
			Name string `json:"name"`
		} `json:"authors"`
		PublishDate string `json:"publish_date"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, false
	}
	entry, ok := data["ISBN:"+isbn]
	if !ok || entry.Title == "" {
		return nil, false
	}
	author := ""
	if len(entry.Authors) > 0 {
		author = entry.Authors[0].Name
	}
	year := 0
	if match := yearPattern.FindString(entry.PublishDate); match != "" {
		year, _ = strconv.Atoi(match)
	}
	return map[string]any{"title": entry.Title, "author": author, "year": year, "isbn": isbn}, true
}
