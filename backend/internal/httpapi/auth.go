package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"formbuilder/backend/internal/auth"
	"formbuilder/backend/internal/httpapi/respond"
)

type loginRequest struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}

type loginResponse struct {
	AccessToken string    `json:"accessToken"`
	TokenType   string    `json:"tokenType"`
	User        auth.User `json:"user"`
}

func (a *API) login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	session, err := a.auth.Login(strings.TrimSpace(req.Identifier), req.Password)
	if err != nil {
		if errors.Is(err, auth.ErrInvalidCredentials) {
			respond.Error(w, http.StatusUnauthorized, "invalid identifier or password")
			return
		}
		a.logger.Error("login failed", "error", err)
		respond.Error(w, http.StatusInternalServerError, "login failed")
		return
	}

	respond.JSON(w, http.StatusOK, loginResponse{
		AccessToken: session.Token,
		TokenType:   "Bearer",
		User:        session.User,
	})
}

func (a *API) me(w http.ResponseWriter, r *http.Request) {
	user, ok := a.userFromRequest(w, r)
	if !ok {
		return
	}
	respond.JSON(w, http.StatusOK, map[string]any{"user": user})
}

func (a *API) logout(w http.ResponseWriter, r *http.Request) {
	token, ok := bearerToken(r)
	if !ok {
		respond.Error(w, http.StatusUnauthorized, "missing bearer token")
		return
	}
	a.auth.Logout(token)
	w.WriteHeader(http.StatusNoContent)
}

func (a *API) userFromRequest(w http.ResponseWriter, r *http.Request) (auth.User, bool) {
	token, ok := bearerToken(r)
	if !ok {
		respond.Error(w, http.StatusUnauthorized, "missing bearer token")
		return auth.User{}, false
	}

	user, err := a.auth.UserByToken(token)
	if err != nil {
		respond.Error(w, http.StatusUnauthorized, "invalid bearer token")
		return auth.User{}, false
	}
	return user, true
}

func bearerToken(r *http.Request) (string, bool) {
	value := strings.TrimSpace(r.Header.Get("Authorization"))
	if value == "" {
		return "", false
	}
	kind, token, ok := strings.Cut(value, " ")
	if !ok || !strings.EqualFold(kind, "Bearer") || strings.TrimSpace(token) == "" {
		return "", false
	}
	return strings.TrimSpace(token), true
}
