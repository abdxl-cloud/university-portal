package identity

import (
	"errors"
	"testing"
	"time"
)

func TestSignAndVerify(t *testing.T) {
	signer := New("01234567890123456789012345678901", time.Minute)
	token, err := signer.Sign("FUT/2022/CSC/10428")
	if err != nil {
		t.Fatal(err)
	}
	got, err := signer.Verify(token)
	if err != nil {
		t.Fatal(err)
	}
	if got != "FUT/2022/CSC/10428" {
		t.Fatalf("got %q", got)
	}
}

func TestVerifyRejectsTamperingAndExpiry(t *testing.T) {
	signer := New("01234567890123456789012345678901", time.Nanosecond)
	token, err := signer.Sign("student")
	if err != nil {
		t.Fatal(err)
	}
	time.Sleep(time.Millisecond)
	if _, err := signer.Verify(token); !errors.Is(err, ErrMalformed) {
		t.Fatalf("expected expiry error, got %v", err)
	}

	signer = New("01234567890123456789012345678901", time.Minute)
	token, _ = signer.Sign("student")
	// Flip a character in the middle of the payload segment rather than the
	// last character of the whole token: the trailing base64 group is a
	// partial 2-byte group, so its final character only carries 4 real bits
	// (the rest is padding) -- mutating it has roughly a 1-in-16 chance of
	// coincidentally decoding to the same bytes, making this assertion flaky.
	mid := len(token) / 2
	replacement := byte('A')
	if token[mid] == 'A' {
		replacement = 'B'
	}
	token = token[:mid] + string(replacement) + token[mid+1:]
	if _, err := signer.Verify(token); err == nil {
		t.Fatal("tampered token verified")
	}
}
