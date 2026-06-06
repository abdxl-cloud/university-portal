# University Portal

A university portal prototype and Go backend for student, staff, and campus-service workflows.

## What Is Included

- `frontend/` - existing frontend app in the repository
- `project/` - exported HTML/CSS/JS prototype used as design/reference material
- `backend/` - Go API scaffold with in-memory domain data and mutation flows
- `docker-compose.yml` - local services for the API, PostgreSQL, and Redis

## Backend

The backend is written in Go and currently uses an in-memory store so development can continue without a local PostgreSQL installation. It is structured so the repositories can later be swapped to PostgreSQL.

Current backend capabilities:

- Demo auth and role-aware endpoints
- Scalar API docs
- Student and staff profile resources
- Fees, invoices, and payment actions
- Course registrations, approvals, and results
- Hostel halls, rooms, beds, applications, and decisions
- Library books, loans, reservations, and returns
- Clinic patients, appointments, prescriptions, and pharmacy inventory
- Notifications, audit logs, and support tickets

## Run The Backend

```powershell
cd backend
go run ./cmd/api
```

API docs:

```txt
http://localhost:8080/docs
```

Health check:

```txt
http://localhost:8080/healthz
```

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

## Verification

From `backend/`:

```powershell
go test ./...
```

## Next Steps

- Add richer request validation and tests
- Persist domain repositories in PostgreSQL
- Add file/document upload support
- Integrate the frontend with the backend API
