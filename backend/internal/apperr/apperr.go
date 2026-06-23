// Package apperr defines the canonical application error kinds and their HTTP
// mapping. Domain/repository code returns these (optionally with a client-safe
// message via the constructors); the HTTP layer turns them into status codes
// with respond.Err. This is the project-wide error convention — every domain
// added in the persistence port should use it instead of bespoke error values.
package apperr

import (
	"errors"
	"net/http"
)

// Sentinel kinds. Use errors.Is(err, apperr.ErrNotFound) to classify.
var (
	ErrNotFound     = errors.New("not found")
	ErrInvalid      = errors.New("invalid input")
	ErrConflict     = errors.New("conflict")
	ErrUnavailable  = errors.New("unavailable")
	ErrUnauthorized = errors.New("unauthorized")
	ErrForbidden    = errors.New("forbidden")
)

// wrapped attaches a human, client-safe message to a sentinel kind while
// remaining errors.Is-comparable to that kind.
type wrapped struct {
	base error
	msg  string
}

func (w *wrapped) Error() string { return w.msg }
func (w *wrapped) Unwrap() error { return w.base }

// New wraps a sentinel kind with a custom message.
func New(kind error, msg string) error { return &wrapped{base: kind, msg: msg} }

// Constructors for the common kinds.
func NotFound(msg string) error    { return New(ErrNotFound, msg) }
func Invalid(msg string) error     { return New(ErrInvalid, msg) }
func Conflict(msg string) error    { return New(ErrConflict, msg) }
func Unavailable(msg string) error { return New(ErrUnavailable, msg) }
func Forbidden(msg string) error   { return New(ErrForbidden, msg) }

// HTTPStatus maps an error to an HTTP status and a client-safe message.
// Unknown errors map to 500 with a generic message (internal details are never
// leaked to clients).
func HTTPStatus(err error) (int, string) {
	switch {
	case err == nil:
		return http.StatusOK, ""
	case errors.Is(err, ErrNotFound):
		return http.StatusNotFound, message(err, "resource not found")
	case errors.Is(err, ErrInvalid):
		return http.StatusBadRequest, message(err, "invalid request")
	case errors.Is(err, ErrConflict):
		return http.StatusConflict, message(err, "conflict")
	case errors.Is(err, ErrUnavailable):
		return http.StatusConflict, message(err, "resource unavailable")
	case errors.Is(err, ErrUnauthorized):
		return http.StatusUnauthorized, message(err, "unauthorized")
	case errors.Is(err, ErrForbidden):
		return http.StatusForbidden, message(err, "forbidden")
	default:
		return http.StatusInternalServerError, "internal error"
	}
}

func message(err error, fallback string) string {
	var w *wrapped
	if errors.As(err, &w) && w.msg != "" {
		return w.msg
	}
	return fallback
}
