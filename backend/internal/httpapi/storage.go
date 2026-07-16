package httpapi

import (
	"io"
	"net/http"
	"strconv"
	"strings"

	"formbuilder/backend/internal/apperr"
	"formbuilder/backend/internal/httpapi/respond"
)

// uploadDocument serves POST /api/v1/documents (multipart/form-data, field
// "file"). Any signed-in user may upload -- they own whatever they upload.
func (a *API) uploadDocument(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, a.cfg.StorageMaxUpload)
	if err := r.ParseMultipartForm(a.cfg.StorageMaxUpload); err != nil {
		respond.Err(w, apperr.Invalid("file too large or invalid multipart body"))
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		respond.Err(w, apperr.Invalid(`a "file" field is required`))
		return
	}
	defer file.Close()
	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	doc, err := a.stor.Upload(r.Context(), user.ID, header.Filename, contentType, file)
	writeMutation(w, err, map[string]any{"document": doc})
}

// canReadDocument mirrors the rest of this domain's access shape: the owner
// can always see their own upload, and any non-student staff role can see
// any document (deferment attachments, graded submissions, etc. all need to
// be reviewable by whichever staff role is handling that case).
func canReadDocument(ownerUserID, callerUserID, callerRole string) bool {
	return ownerUserID == callerUserID || callerRole != "student"
}

// documentMeta serves GET /api/v1/documents/{id}.
func (a *API) documentMeta(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	doc, err := a.stor.Get(r.Context(), r.PathValue("id"))
	if err != nil {
		respond.Err(w, err)
		return
	}
	if !canReadDocument(doc.OwnerUserID, user.ID, user.Role) {
		respond.Error(w, http.StatusForbidden, "forbidden")
		return
	}
	respond.JSON(w, http.StatusOK, doc)
}

// downloadDocument serves GET /api/v1/documents/{id}/download.
func (a *API) downloadDocument(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireUser(w, r)
	if !ok {
		return
	}
	id := r.PathValue("id")
	doc, err := a.stor.Get(r.Context(), id)
	if err != nil {
		respond.Err(w, err)
		return
	}
	if !canReadDocument(doc.OwnerUserID, user.ID, user.Role) {
		respond.Error(w, http.StatusForbidden, "forbidden")
		return
	}
	rc, _, err := a.stor.Open(r.Context(), id)
	if err != nil {
		respond.Err(w, err)
		return
	}
	defer rc.Close()

	safeName := strings.ReplaceAll(doc.Filename, `"`, "")
	w.Header().Set("Content-Type", doc.ContentType)
	w.Header().Set("Content-Disposition", `attachment; filename="`+safeName+`"`)
	w.Header().Set("Content-Length", strconv.FormatInt(doc.SizeBytes, 10))
	_, _ = io.Copy(w, rc)
}
