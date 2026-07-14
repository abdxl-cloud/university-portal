# FormBuilder Backend

Go API for the student portal prototype.

## Stack

- Go HTTP API
- PostgreSQL
- Redis-ready background jobs
- `sqlc`-ready query layout
- SQL migrations in `migrations/`

## Run Locally

Install Go, then:

```powershell
cd backend
Copy-Item .env.example .env
go run ./cmd/api
```

Health endpoints:

```txt
GET http://localhost:8080/healthz
GET http://localhost:8080/api/v1/health
```

API docs:

```txt
http://localhost:8080/docs
```

OpenAPI document:

```txt
http://localhost:8080/openapi.json
```

Demo login:

```powershell
$body = @{ identifier = "FUT/2022/CSC/10428"; password = "demo1234" } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/auth/login -ContentType "application/json" -Body $body
Invoke-RestMethod -Uri http://localhost:8080/api/v1/me -Headers @{ Authorization = "Bearer $($login.accessToken)" }
```

All seeded development accounts use the password `demo1234`:

| Role | Identifier |
| --- | --- |
| Student | `FUT/2022/CSC/10428` |
| Lecturer | `FUT/STF/CSC/0391` |
| Academic adviser | `FUT/STF/CSC/0288` |
| Head of department | `FUT/STF/CSC/0102` |
| Dean | `FUT/STF/COM/0007` |
| Exams officer | `FUT/STF/EXM/0451` |
| Bursary | `FUT/STF/BUR/0319` |
| Librarian | `FUT/STF/LIB/0044` |
| Clinic | `FUT/STF/MED/0009` |
| Hostel officer | `FUT/STF/SAF/0277` |
| Registry | `FUT/STF/REG/0061` |
| ICT administrator | `FUT/STF/ICT/0015` |

## Run With Docker Compose

From the project root:

```powershell
docker compose up --build
```

API:

```txt
http://localhost:8080
```

PostgreSQL:

```txt
localhost:5432
user: formbuilder
password: formbuilder
database: formbuilder
```

## Suggested Next Modules

The backend currently exposes seeded in-memory read APIs for:

- Auth and current user
- Dashboard summary
- Academic sessions, faculties, departments, programs
- Students and staff
- Fees, invoices, and payments
- Courses, course registrations, and results
- Hostel halls, rooms, beds, and applications
- Library books, loans, and reservations
- Clinic patients, appointments, prescriptions, and pharmacy
- Approvals, notifications, audit logs, and support tickets

It also exposes seeded in-memory write APIs for:

- Paying invoices
- Submitting course registrations
- Deciding approval tasks
- Applying for hostel accommodation
- Allocating/rejecting hostel applications
- Borrowing, reserving, and returning library books
- Booking and updating clinic appointments
- Marking notifications as read

Suggested next backend layer:

1. Add richer request validation and tests.
2. Expand staff workflows for result publishing and pharmacy inventory.
3. Move repositories from in-memory storage to PostgreSQL.
4. Add file/document upload support.
