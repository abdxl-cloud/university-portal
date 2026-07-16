// Package storage owns document uploads: a Storer interface (DiskStorer is
// the only implementation; swap in an S3-compatible one later without
// touching Repo or callers) plus the documents table recording who owns
// what. Follows backend/CONVENTIONS.md.
package storage

import (
	"context"
	"io"

	"github.com/jackc/pgx/v5/pgxpool"

	"formbuilder/backend/internal/apperr"
	"formbuilder/backend/internal/db"
	"formbuilder/backend/internal/portal"
)

type Repo struct {
	pool  *pgxpool.Pool
	store Storer
}

func NewRepo(pool *pgxpool.Pool, store Storer) *Repo {
	return &Repo{pool: pool, store: store}
}

// Upload streams body into storage and records its metadata, owned by
// ownerUserID. If the metadata insert fails, the just-written file is
// cleaned up rather than left orphaned.
func (r *Repo) Upload(ctx context.Context, ownerUserID, filename, contentType string, body io.Reader) (portal.Document, error) {
	if filename == "" {
		return portal.Document{}, apperr.Invalid("filename is required")
	}
	key, size, err := r.store.Put(ctx, body)
	if err != nil {
		return portal.Document{}, apperr.Unavailable("could not store the file")
	}
	var doc portal.Document
	err = r.pool.QueryRow(ctx, `
		INSERT INTO documents (owner_user_id, filename, content_type, size_bytes, storage_key)
		VALUES ($1::uuid, $2, $3, $4, $5)
		RETURNING id::text, owner_user_id::text, filename, content_type, size_bytes, created_at`,
		ownerUserID, filename, contentType, size, key).
		Scan(&doc.ID, &doc.OwnerUserID, &doc.Filename, &doc.ContentType, &doc.SizeBytes, &doc.CreatedAt)
	if err != nil {
		_ = r.store.Delete(ctx, key)
		return portal.Document{}, db.Translate(err)
	}
	return doc, nil
}

// Get returns a document's metadata only (no file I/O) -- cheap enough to
// use purely for an authorization check before Open.
func (r *Repo) Get(ctx context.Context, id string) (portal.Document, error) {
	var doc portal.Document
	err := r.pool.QueryRow(ctx, `
		SELECT id::text, owner_user_id::text, filename, content_type, size_bytes, created_at
		FROM documents WHERE id=$1::uuid`, id).
		Scan(&doc.ID, &doc.OwnerUserID, &doc.Filename, &doc.ContentType, &doc.SizeBytes, &doc.CreatedAt)
	if db.IsNotFound(err) {
		return portal.Document{}, apperr.NotFound("document not found")
	}
	return doc, err
}

// Open streams a document's bytes alongside its metadata. Caller must Close
// the returned reader.
func (r *Repo) Open(ctx context.Context, id string) (io.ReadCloser, portal.Document, error) {
	var doc portal.Document
	var key string
	err := r.pool.QueryRow(ctx, `
		SELECT id::text, owner_user_id::text, filename, content_type, size_bytes, created_at, storage_key
		FROM documents WHERE id=$1::uuid`, id).
		Scan(&doc.ID, &doc.OwnerUserID, &doc.Filename, &doc.ContentType, &doc.SizeBytes, &doc.CreatedAt, &key)
	if db.IsNotFound(err) {
		return nil, portal.Document{}, apperr.NotFound("document not found")
	}
	if err != nil {
		return nil, portal.Document{}, err
	}
	rc, err := r.store.Open(ctx, key)
	if err != nil {
		return nil, portal.Document{}, apperr.Unavailable("could not open the file")
	}
	return rc, doc, nil
}
