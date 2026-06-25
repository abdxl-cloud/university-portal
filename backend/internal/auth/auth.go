// Package auth provides database-backed authentication using opaque bearer
// tokens. A login verifies the password (bcrypt) against the users table and
// creates a row in sessions storing only the SHA-256 hash of the token, so a
// leaked database never exposes usable tokens. Logout/revocation deletes the
// row; expired rows are pruned by CleanupExpired.
package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
)

type User struct {
	ID          string `json:"id"`
	Identifier  string `json:"identifier"`
	DisplayName string `json:"displayName"`
	Email       string `json:"email"`
	Role        string `json:"role"`
	RoleLabel   string `json:"roleLabel"`
}

type Service struct {
	pool       *pgxpool.Pool
	sessionTTL time.Duration
}

func NewService(pool *pgxpool.Pool, sessionTTL time.Duration) *Service {
	if sessionTTL <= 0 {
		sessionTTL = 168 * time.Hour
	}
	return &Service{pool: pool, sessionTTL: sessionTTL}
}

// Login verifies credentials and returns a new opaque bearer token plus the user.
func (s *Service) Login(ctx context.Context, identifier, password string) (string, User, error) {
	var u User
	var hash string
	err := s.pool.QueryRow(ctx, `
		SELECT u.id::text, u.identifier, u.display_name, COALESCE(u.email, ''), r.code, r.name, u.password_hash
		FROM users u
		JOIN roles r ON r.id = u.role_id
		WHERE u.identifier = $1 AND u.status = 'active'`, identifier).
		Scan(&u.ID, &u.Identifier, &u.DisplayName, &u.Email, &u.Role, &u.RoleLabel, &hash)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", User{}, ErrInvalidCredentials
	}
	if err != nil {
		return "", User{}, err
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
		return "", User{}, ErrInvalidCredentials
	}

	token, err := newToken()
	if err != nil {
		return "", User{}, err
	}
	expiresAt := time.Now().UTC().Add(s.sessionTTL)
	if _, err := s.pool.Exec(ctx, `
		INSERT INTO sessions (user_id, token_hash, expires_at)
		VALUES ($1::uuid, $2, $3)`, u.ID, hashToken(token), expiresAt); err != nil {
		return "", User{}, err
	}
	return token, u, nil
}

// UserByToken resolves the user for a live (non-expired) session token.
func (s *Service) UserByToken(ctx context.Context, token string) (User, error) {
	var u User
	err := s.pool.QueryRow(ctx, `
		SELECT u.id::text, u.identifier, u.display_name, COALESCE(u.email, ''), r.code, r.name
		FROM sessions sess
		JOIN users u ON u.id = sess.user_id
		JOIN roles r ON r.id = u.role_id
		WHERE sess.token_hash = $1 AND sess.expires_at > now() AND u.status = 'active'`,
		hashToken(token)).
		Scan(&u.ID, &u.Identifier, &u.DisplayName, &u.Email, &u.Role, &u.RoleLabel)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrInvalidToken
	}
	if err != nil {
		return User{}, err
	}
	return u, nil
}

// Logout revokes a session immediately.
func (s *Service) Logout(ctx context.Context, token string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM sessions WHERE token_hash = $1`, hashToken(token))
	return err
}

// CleanupExpired deletes sessions past their expiry; safe to call periodically.
func (s *Service) CleanupExpired(ctx context.Context) (int64, error) {
	ct, err := s.pool.Exec(ctx, `DELETE FROM sessions WHERE expires_at <= now()`)
	if err != nil {
		return 0, err
	}
	return ct.RowsAffected(), nil
}

// DisableDemoAccounts prevents the bundled prototype credentials from being
// usable in production, including on databases created by older migrations.
func DisableDemoAccounts(ctx context.Context, pool *pgxpool.Pool) (int64, error) {
	tag, err := pool.Exec(ctx, `UPDATE users SET status='disabled', updated_at=now() WHERE status='active' AND password_hash = crypt('demo1234', password_hash)`)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func newToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
