# FormBuilder Backend

Go API for the university portal prototype.

## Stack

- Go HTTP API
- PostgreSQL
- Embedded SQL migrations applied on API boot
- Seeded demo data for frontend development

## Recommended Local Run

If you have Docker, you do not need Go or PostgreSQL installed locally. Docker Compose starts PostgreSQL and Redis as containers.

From the repository root, build the backend locally:

```sh
docker compose up --build api
```

Or run the published Docker Hub backend image:

```sh
docker compose -f docker-compose.backend-image.yml up
```

Docker Compose starts:

- API: `http://localhost:8080`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

The API waits for PostgreSQL to be healthy before starting.

## Useful Endpoints

```txt
GET http://localhost:8080/healthz
GET http://localhost:8080/api/v1/health
GET http://localhost:8080/docs
GET http://localhost:8080/openapi.json
```

## Demo Login

All demo users use password `demo1234`.

```sh
curl -s http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"FUT/2022/CSC/10428","password":"demo1234"}'
```

Use the returned token for authenticated endpoints:

```sh
TOKEN="paste-access-token-here"
curl -s http://localhost:8080/api/v1/me \
  -H "Authorization: Bearer $TOKEN"
```

## Native Go Run

For native `go run`, PostgreSQL must already be running and reachable through `DATABASE_URL`.

```sh
cd backend
cp .env.example .env
set -a
. ./.env
set +a
go run ./cmd/api
```

`go run` does not automatically read `.env`; the shell commands above export it.

## Frontend CORS

The default `ALLOWED_ORIGINS` includes common frontend dev and preview ports:

- `http://localhost:3000`
- `http://localhost:3014`
- `http://localhost:4173`
- `http://localhost:4174`
- `http://localhost:5173`
- `http://localhost:5174`

Add any deployed preview URL to `ALLOWED_ORIGINS` when testing from a remote browser.

## Verification

```sh
go test ./...
```
