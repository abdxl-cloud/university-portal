package httpapi

import (
	"errors"
	"net/http"

	"formbuilder/backend/internal/apperr"
	"formbuilder/backend/internal/httpapi/respond"
)

type setModuleRequest struct {
	Code    string `json:"code"`
	Enabled *bool  `json:"enabled"`
}

func (r setModuleRequest) Validate() error {
	if r.Code == "" {
		return apperr.Invalid("code is required")
	}
	if r.Enabled == nil {
		return apperr.Invalid("enabled is required")
	}
	return nil
}

func (a *API) listModules(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireUser(w, r); !ok {
		return
	}
	mods, err := a.modules.List(r.Context())
	if err != nil {
		respond.Err(w, err)
		return
	}
	respond.JSON(w, http.StatusOK, map[string]any{"modules": mods})
}

func (a *API) setModuleEnabled(w http.ResponseWriter, r *http.Request) {
	if _, ok := a.requireRole(w, r, "ict"); !ok {
		return
	}
	var req setModuleRequest
	if !bind(w, r, &req) {
		return
	}
	mod, err := a.modules.SetEnabled(r.Context(), req.Code, *req.Enabled)
	writeMutation(w, err, map[string]any{"module": mod})
}

func (a *API) requireModule(w http.ResponseWriter, r *http.Request, code string) bool {
	enabled, err := a.modules.Enabled(r.Context(), code)
	if err != nil {
		if errors.Is(err, apperr.ErrNotFound) {
			respond.Err(w, apperr.NotFound("module disabled"))
			return false
		}
		a.logger.Error("check module", "module", code, "error", err)
		respond.Error(w, http.StatusInternalServerError, "module check failed")
		return false
	}
	if !enabled {
		respond.Err(w, apperr.NotFound("module disabled"))
		return false
	}
	return true
}

func (a *API) moduleHandler(code string, handler func(http.ResponseWriter, *http.Request)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !a.requireModule(w, r, code) {
			return
		}
		handler(w, r)
	}
}
