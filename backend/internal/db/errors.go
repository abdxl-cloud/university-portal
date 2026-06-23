package db

import (
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"formbuilder/backend/internal/apperr"
)

// Translate converts low-level pgx/Postgres errors into canonical apperr kinds.
// Repositories can wrap raw query errors with this so handlers get consistent
// HTTP statuses without each domain re-implementing the mapping.
func Translate(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return apperr.ErrNotFound
	}
	var pg *pgconn.PgError
	if errors.As(err, &pg) {
		switch pg.Code {
		case "23505": // unique_violation
			return apperr.Conflict("already exists")
		case "23503": // foreign_key_violation
			return apperr.Invalid("referenced resource does not exist")
		case "23502": // not_null_violation
			return apperr.Invalid("missing required field")
		case "23514": // check_violation
			return apperr.Invalid("value violates a constraint")
		}
	}
	return err
}

// IsNotFound reports whether err is (or wraps) pgx.ErrNoRows.
func IsNotFound(err error) bool { return errors.Is(err, pgx.ErrNoRows) }
