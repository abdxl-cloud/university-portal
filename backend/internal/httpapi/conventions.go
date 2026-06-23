package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"formbuilder/backend/internal/httpapi/respond"
)

// Validator is implemented by request bodies that can self-validate. bind() runs
// Validate automatically after decoding, so handlers never repeat the check.
type Validator interface {
	Validate() error
}

// bind decodes a JSON request body into dst and, if dst implements Validator,
// validates it. On any failure it writes the error response and returns false.
func bind(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid JSON body")
		return false
	}
	if v, ok := dst.(Validator); ok {
		if err := v.Validate(); err != nil {
			respond.Err(w, err)
			return false
		}
	}
	return true
}

// serveList is the standard read handler: parse pagination, call a repo list
// method returning (items, total, err), and write the {data, page} envelope.
func serveList[T any](a *API, w http.ResponseWriter, r *http.Request, name string, fetch func(ctx context.Context, limit, offset int) ([]T, int, error)) {
	page := parsePage(r)
	items, total, err := fetch(r.Context(), page.Limit, page.Offset)
	if err != nil {
		a.logger.Error("list "+name, "error", err)
		respond.Err(w, err)
		return
	}
	page.Total = total
	respond.List(w, items, page)
}

// writeMutation is the standard terminator for mutating handlers: it maps a
// domain error through respond.Err, or returns the success body as JSON.
func writeMutation(w http.ResponseWriter, err error, body any) {
	if err != nil {
		respond.Err(w, err)
		return
	}
	respond.JSON(w, http.StatusOK, body)
}

const (
	defaultPageLimit = 50
	maxPageLimit     = 200
)

// parsePage reads ?limit=&offset= with sane defaults and caps. Total is filled
// in by the handler from the repository count.
func parsePage(r *http.Request) respond.Page {
	limit := queryInt(r, "limit", defaultPageLimit)
	if limit < 1 {
		limit = defaultPageLimit
	}
	if limit > maxPageLimit {
		limit = maxPageLimit
	}
	offset := queryInt(r, "offset", 0)
	if offset < 0 {
		offset = 0
	}
	return respond.Page{Limit: limit, Offset: offset}
}

func queryInt(r *http.Request, key string, def int) int {
	if v := r.URL.Query().Get(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}
