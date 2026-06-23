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
	"errors"
	"strings"
)

var (
	ErrEmptyPayload = errors.New("identity: empty payload")
	ErrMalformed    = errors.New("identity: malformed token")
	ErrBadSignature = errors.New("identity: signature mismatch")
)

type Signer struct {
	secret []byte
}

func New(secret string) *Signer {
	return &Signer{secret: []byte(secret)}
}

// Sign returns a signed token for the given payload (e.g. a matric number).
func (s *Signer) Sign(payload string) (string, error) {
	if strings.TrimSpace(payload) == "" {
		return "", ErrEmptyPayload
	}
	enc := base64.RawURLEncoding
	return enc.EncodeToString([]byte(payload)) + "." + enc.EncodeToString(s.mac(payload)), nil
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
	if !hmac.Equal(sig, s.mac(string(payloadBytes))) {
		return "", ErrBadSignature
	}
	return string(payloadBytes), nil
}

func (s *Signer) mac(payload string) []byte {
	m := hmac.New(sha256.New, s.secret)
	m.Write([]byte(payload))
	return m.Sum(nil)
}
