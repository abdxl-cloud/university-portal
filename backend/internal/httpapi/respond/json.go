package respond

import (
	"encoding/json"
	"net/http"

	"formbuilder/backend/internal/apperr"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

// Page is the standard pagination block returned alongside list payloads.
type Page struct {
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
	Total  int `json:"total"`
}

func JSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if body == nil {
		return
	}
	_ = json.NewEncoder(w).Encode(body)
}

func Error(w http.ResponseWriter, status int, message string) {
	JSON(w, status, ErrorResponse{Error: message})
}

// Err writes an error using the canonical apperr -> HTTP mapping. This is the
// single place handlers should send domain errors.
func Err(w http.ResponseWriter, err error) {
	status, message := apperr.HTTPStatus(err)
	Error(w, status, message)
}

// List writes the standard list envelope: {"data": [...], "page": {...}}.
func List(w http.ResponseWriter, items any, page Page) {
	JSON(w, http.StatusOK, map[string]any{"data": items, "page": page})
}
