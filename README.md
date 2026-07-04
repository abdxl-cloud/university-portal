# University Portal

A university portal prototype and Go API for student, staff, admissions, and campus-service workflows.

## What Is Included

- `prototype/` - Vite React prototype converted from the standalone app kit.
- `frontend/` - existing frontend app in the repository.
- `backend/` - Go API backed by PostgreSQL, with embedded migrations and seeded demo data.
- `docker-compose.yml` - local API, PostgreSQL, and Redis services.

## Run The Backend For Frontend Work

If you have Docker, you do not need Go or PostgreSQL installed locally. Docker Compose starts PostgreSQL and Redis as containers.

To build the backend locally:

```sh
docker compose up --build api
```

To use the published Docker Hub backend image instead:

```sh
docker compose -f docker-compose.backend-image.yml up
```

This starts PostgreSQL, Redis, and the Go API. The API runs at:

```txt
http://localhost:8080
```

Useful URLs:

```txt
http://localhost:8080/healthz
http://localhost:8080/api/v1/health
http://localhost:8080/docs
http://localhost:8080/openapi.json
```

## Run The Prototype

```sh
cd prototype
npm install
npm run dev
```

The backend CORS defaults allow common local frontend ports including `3000`, `3014`, `4173`, `4174`, `5173`, and `5174`.

## Demo Login

All demo users use this password:

```txt
demo1234
```

Example student identifier:

```txt
FUT/2022/CSC/10428
```

Example staff identifiers:

```txt
FUT/STF/CSC/0391  Lecturer
FUT/STF/CSC/0102  HOD
FUT/STF/BUR/0319  Bursary
FUT/STF/LIB/0044  Librarian
FUT/STF/MED/0009  Medical Officer
FUT/STF/ICT/0015  ICT Admin
```

## Backend Verification

```sh
cd backend
go test ./...
```
