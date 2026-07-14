// Package modules stores deployment-level feature flags. Each school runs its
// own deployment/database, so these flags configure which services that school
// has purchased or operationally supports.
package modules

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"formbuilder/backend/internal/apperr"
	"formbuilder/backend/internal/db"
)

type Module struct {
	Code     string         `json:"code"`
	Name     string         `json:"name"`
	Enabled  bool           `json:"enabled"`
	Settings map[string]any `json:"settings"`
}

type Repo struct {
	pool *pgxpool.Pool
}

func NewRepo(pool *pgxpool.Pool) *Repo {
	return &Repo{pool: pool}
}

func (r *Repo) List(ctx context.Context) ([]Module, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT code, name, enabled, settings
		FROM app_modules
		ORDER BY code`)
	if err != nil {
		return nil, db.Translate(err)
	}
	defer rows.Close()

	out := []Module{}
	for rows.Next() {
		mod, err := scanModule(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, mod)
	}
	return out, rows.Err()
}

func (r *Repo) Enabled(ctx context.Context, code string) (bool, error) {
	var enabled bool
	err := r.pool.QueryRow(ctx, `SELECT enabled FROM app_modules WHERE code=$1`, code).Scan(&enabled)
	if db.IsNotFound(err) {
		return false, apperr.NotFound("module not found")
	}
	if err != nil {
		return false, db.Translate(err)
	}
	return enabled, nil
}

func (r *Repo) SetEnabled(ctx context.Context, code string, enabled bool) (Module, error) {
	mod, err := scanModule(r.pool.QueryRow(ctx, `
		UPDATE app_modules
		SET enabled=$2, updated_at=now()
		WHERE code=$1
		RETURNING code, name, enabled, settings`, code, enabled))
	if db.IsNotFound(err) {
		return Module{}, apperr.NotFound("module not found")
	}
	if err != nil {
		return Module{}, db.Translate(err)
	}
	return mod, nil
}

func scanModule(row pgx.Row) (Module, error) {
	var mod Module
	var raw []byte
	if err := row.Scan(&mod.Code, &mod.Name, &mod.Enabled, &raw); err != nil {
		return Module{}, err
	}
	mod.Settings = map[string]any{}
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &mod.Settings)
	}
	return mod, nil
}
