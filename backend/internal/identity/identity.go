// Package identity issues and verifies short, signed identity tokens that are
// rendered as QR codes (matric number for students, staff number for staff).
//
// A token is `<base64url(payload)>.<base64url(hmac-sha256(payload))>`. It is
// fully offline-verifiable and tamper-evident: anyone holding the shared secret
// can confirm a scanned code is genuine without a database round-trip, which is
// exactly what the cheap/offline-ish library scanning flow needs.
package identity

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

var (
	ErrEmptyPayload = errors.New("identity: empty payload")
	ErrMalformed    = errors.New("identity: malformed token")
	ErrBadSignature = errors.New("identity: signature mismatch")
)

type Signer struct {
	secret []byte
	ttl    time.Duration
}

type claims struct {
	Subject   string `json:"sub"`
	Audience  string `json:"aud"`
	ExpiresAt int64  `json:"exp"`
}

func New(secret string, ttl time.Duration) *Signer {
	if ttl <= 0 {
		ttl = 5 * time.Minute
	}
	return &Signer{secret: []byte(secret), ttl: ttl}
}

// Sign returns a signed token for the given payload (e.g. a matric number).
func (s *Signer) Sign(payload string) (string, error) {
	if strings.TrimSpace(payload) == "" {
		return "", ErrEmptyPayload
	}
	body, err := json.Marshal(claims{Subject: strings.TrimSpace(payload), Audience: "student-identity", ExpiresAt: time.Now().Add(s.ttl).Unix()})
	if err != nil {
		return "", err
	}
	enc := base64.RawURLEncoding
	return enc.EncodeToString(body) + "." + enc.EncodeToString(s.mac(body)), nil
}

// Verify checks a token's signature and returns the embedded payload.
func (s *Signer) Verify(token string) (string, error) {
	enc := base64.RawURLEncoding
	rawPayload, rawSig, ok := strings.Cut(strings.TrimSpace(token), ".")
	if !ok {
		return "", ErrMalformed
	}
	payloadBytes, err := enc.DecodeString(rawPayload)
	if err != nil {
		return "", ErrMalformed
	}
	sig, err := enc.DecodeString(rawSig)
	if err != nil {
		return "", ErrMalformed
	}
	if !hmac.Equal(sig, s.mac(payloadBytes)) {
		return "", ErrBadSignature
	}
	var c claims
	if err := json.Unmarshal(payloadBytes, &c); err != nil {
		return "", ErrMalformed
	}
	if c.Subject == "" || c.Audience != "student-identity" || time.Now().Unix() >= c.ExpiresAt {
		return "", ErrMalformed
	}
	return c.Subject, nil
}

func (s *Signer) mac(payload []byte) []byte {
	m := hmac.New(sha256.New, s.secret)
	m.Write(payload)
	return m.Sum(nil)
}
