package storage

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"io"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestDiskStorerPutOpenDelete(t *testing.T) {
	store, err := NewDiskStorer(t.TempDir())
	if err != nil {
		t.Fatalf("new disk storer: %v", err)
	}
	ctx := context.Background()
	content := []byte("hello from a test file")

	key, size, err := store.Put(ctx, bytes.NewReader(content))
	if err != nil {
		t.Fatalf("put: %v", err)
	}
	if size != int64(len(content)) {
		t.Fatalf("expected size %d, got %d", len(content), size)
	}

	rc, err := store.Open(ctx, key)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	got, err := io.ReadAll(rc)
	rc.Close()
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	if !bytes.Equal(got, content) {
		t.Fatalf("content mismatch: got %q", got)
	}

	if err := store.Delete(ctx, key); err != nil {
		t.Fatalf("delete: %v", err)
	}
	if _, err := store.Open(ctx, key); err == nil {
		t.Fatal("expected open after delete to fail")
	}
}

func TestDiskStorerRejectsPathTraversal(t *testing.T) {
	store, err := NewDiskStorer(t.TempDir())
	if err != nil {
		t.Fatalf("new disk storer: %v", err)
	}
	ctx := context.Background()
	for _, key := range []string{"../secret", "a/../../b", "/etc/passwd", "sub/dir"} {
		if _, err := store.Open(ctx, key); err == nil {
			t.Fatalf("expected %q to be rejected", key)
		}
	}
}

func rid(t *testing.T) string {
	t.Helper()
	b := make([]byte, 4)
	if _, err := rand.Read(b); err != nil {
		t.Fatalf("rand: %v", err)
	}
	return hex.EncodeToString(b)
}

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set, skipping integration test")
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

func TestRepoUploadGetOpen(t *testing.T) {
	pool := testPool(t)
	ctx := context.Background()
	suffix := rid(t)

	var roleID, userID string
	if err := pool.QueryRow(ctx, `SELECT id::text FROM roles WHERE code='student'`).Scan(&roleID); err != nil {
		t.Fatalf("find student role: %v", err)
	}
	if err := pool.QueryRow(ctx, `
		INSERT INTO users (role_id, identifier, password_hash, display_name) VALUES ($1::uuid, $2, 'x', 'Test Uploader') RETURNING id::text`,
		roleID, "TST/DOC/"+suffix).Scan(&userID); err != nil {
		t.Fatalf("create test user: %v", err)
	}
	t.Cleanup(func() {
		pool.Exec(context.Background(), `DELETE FROM documents WHERE owner_user_id=$1::uuid`, userID)
		pool.Exec(context.Background(), `DELETE FROM audit_logs WHERE actor_user_id=$1::uuid`, userID)
		pool.Exec(context.Background(), `DELETE FROM users WHERE id=$1::uuid`, userID)
	})

	store, err := NewDiskStorer(t.TempDir())
	if err != nil {
		t.Fatalf("new disk storer: %v", err)
	}
	r := NewRepo(pool, store)

	content := []byte("assignment submission bytes")
	doc, err := r.Upload(ctx, userID, "submission.pdf", "application/pdf", bytes.NewReader(content))
	if err != nil {
		t.Fatalf("upload: %v", err)
	}
	if doc.Filename != "submission.pdf" || doc.OwnerUserID != userID || doc.SizeBytes != int64(len(content)) {
		t.Fatalf("unexpected document: %+v", doc)
	}

	meta, err := r.Get(ctx, doc.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if meta.ID != doc.ID {
		t.Fatalf("get id mismatch: %+v", meta)
	}

	rc, openedMeta, err := r.Open(ctx, doc.ID)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	got, err := io.ReadAll(rc)
	rc.Close()
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	if !bytes.Equal(got, content) {
		t.Fatalf("content mismatch: got %q", got)
	}
	if openedMeta.ContentType != "application/pdf" {
		t.Fatalf("unexpected content type: %s", openedMeta.ContentType)
	}

	if _, err := r.Get(ctx, "00000000-0000-0000-0000-000000000000"); err == nil {
		t.Fatal("expected not found for a bogus id")
	}
}
