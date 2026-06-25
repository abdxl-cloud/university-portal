package db

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// Conn is the common query surface implemented by both *pgxpool.Pool and pgx.Tx.
// Repository helpers take a Conn so the same code runs standalone or inside a
// transaction.
type Conn interface {
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

// UUIDOrNil converts an optional UUID string into a nullable query argument.
func UUIDOrNil(value string) any {
	if value == "" {
		return nil
	}
	return value
}
