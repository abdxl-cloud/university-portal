# Backend data-access conventions

These are the rules every domain follows when it moves from the in-memory
`internal/portal` demo store to Postgres. `internal/library` is the reference
implementation — copy its shape.

## Data access
- **Hand-written pgx**, no ORM and no sqlc (the sqlc config was removed). Write
  SQL inline in the repository.
- A repository is a struct holding `*pgxpool.Pool`, e.g. `library.Repo`. One repo
  per domain, constructed in `httpapi.New` from the shared pool.
- Use the shared helpers in `internal/db`:
  - `db.Conn` — query surface implemented by both the pool and a `pgx.Tx`; take it
    in helpers that must run either standalone or inside a transaction.
  - `db.InTx(ctx, pool, func(tx) (T, error))` — generic transaction runner
    (commit on success, rollback on error). Use it for any multi-statement mutation.
  - `db.IsNotFound(err)` / `db.Translate(err)` — classify pgx errors. `Translate`
    maps unique/FK/not-null violations to the right `apperr` kind.
- Cast UUID columns with `::text` on select and `$n::uuid` on parameters.

## Errors
- Repositories return `apperr` values, never raw strings or bespoke sentinels:
  `apperr.NotFound("book not found")`, `apperr.Invalid(...)`, `apperr.Conflict(...)`,
  `apperr.Unavailable(...)`. These remain `errors.Is`-comparable to their kind.
- Handlers send them with `respond.Err(w, err)` (or `writeMutation`, which calls it).
  Unknown errors become a generic 500 — internal details are never leaked.

## HTTP handlers
- Mutations: `requireRole(...)` → `bind(w, r, &req)` → repo call → `writeMutation(w, err, body)`.
- `bind` decodes JSON and, if the request implements `Validate() error`, validates
  it. Give every request struct a `Validate()` returning `apperr.Invalid(...)`.
- Lists: `page := parsePage(r)` → repo returns `(items, total, err)` →
  `page.Total = total` → `respond.List(w, items, page)`.
  The envelope is `{ "data": [...], "page": { "limit", "offset", "total" } }`.

## Auditing
- Mutations write `audit_logs` with the acting user's real `users.id` UUID
  (passed as `actorUserID` from `user.ID`) plus a JSON metadata blob.

## Migrations
- Add `NNNNNN_name.up.sql` (+ `.down.sql`) under `migrations/`. They are embedded
  and applied in order on boot by `internal/db.Migrate`; tracked in `schema_migrations`.
