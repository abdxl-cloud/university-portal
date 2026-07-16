package storage

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// Storer is the minimal interface document storage needs. DiskStorer is the
// only implementation today; an S3-compatible one can satisfy this same
// interface later without touching Repo or any caller.
type Storer interface {
	Put(ctx context.Context, r io.Reader) (key string, size int64, err error)
	Open(ctx context.Context, key string) (io.ReadCloser, error)
	Delete(ctx context.Context, key string) error
}

// DiskStorer keeps files under a single directory, named by a random key
// (never the client-supplied filename, which is only ever display metadata
// stored in Postgres).
type DiskStorer struct {
	dir string
}

func NewDiskStorer(dir string) (*DiskStorer, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("create storage dir: %w", err)
	}
	return &DiskStorer{dir: dir}, nil
}

func (d *DiskStorer) Put(ctx context.Context, r io.Reader) (string, int64, error) {
	key, err := randomKey()
	if err != nil {
		return "", 0, err
	}
	path := filepath.Join(d.dir, key)
	f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return "", 0, err
	}
	defer f.Close()
	n, err := io.Copy(f, r)
	if err != nil {
		_ = os.Remove(path)
		return "", 0, err
	}
	return key, n, nil
}

func (d *DiskStorer) Open(ctx context.Context, key string) (io.ReadCloser, error) {
	path, err := d.safePath(key)
	if err != nil {
		return nil, err
	}
	return os.Open(path)
}

func (d *DiskStorer) Delete(ctx context.Context, key string) error {
	path, err := d.safePath(key)
	if err != nil {
		return err
	}
	return os.Remove(path)
}

// safePath guards against a key escaping the storage dir. randomKey never
// produces path separators itself, but this is cheap defence in depth for
// any storage_key that reaches here without being freshly minted.
func (d *DiskStorer) safePath(key string) (string, error) {
	if key == "" || key != filepath.Clean(key) || strings.ContainsAny(key, `/\`) {
		return "", fmt.Errorf("invalid storage key")
	}
	return filepath.Join(d.dir, key), nil
}

func randomKey() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
