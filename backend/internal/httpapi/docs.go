package httpapi

import (
	"net/http"
)

func (a *API) docs(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(`<!doctype html>
<html lang="en">
  <head>
    <title>FormBuilder API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
      Scalar.createApiReference('#app', {
        url: '/openapi.json',
        theme: 'kepler'
      })
    </script>
  </body>
</html>`))
}

func (a *API) openapi(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(openAPISpec))
}

const openAPISpec = `{
  "openapi": "3.1.0",
  "info": {
    "title": "FormBuilder Student Portal API",
    "summary": "Backend API for the FUTECH student portal prototype.",
    "version": "0.1.0"
  },
  "servers": [
    {
      "url": "http://localhost:8080",
      "description": "Local development"
    }
  ],
  "tags": [
    { "name": "System", "description": "Health and metadata endpoints" },
    { "name": "Auth", "description": "Demo in-memory authentication endpoints" },
    { "name": "Modules", "description": "Deployment-level feature flags" },
    { "name": "Portal", "description": "Cross-module portal resources" },
    { "name": "Academic", "description": "Sessions, faculties, departments, programs, courses, registrations, and results" },
    { "name": "Finance", "description": "Invoices and payments" },
    { "name": "Hostels", "description": "Accommodation resources" },
    { "name": "Library", "description": "Library catalogue, loans, and reservations" },
    { "name": "Identity", "description": "Signed QR identity tokens and verification" },
    { "name": "Clinic", "description": "Health centre resources" },
    { "name": "Operations", "description": "Approvals, notifications, support, and audit logs" }
  ],
  "paths": {
    "/healthz": {
      "get": {
        "tags": ["System"],
        "summary": "Health check",
        "operationId": "healthz",
        "responses": {
          "200": {
            "description": "API is healthy",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HealthResponse"
                },
                "examples": {
                  "ok": {
                    "value": {
                      "status": "ok",
                      "time": "2026-06-05T16:28:30Z"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/health": {
      "get": {
        "tags": ["System"],
        "summary": "Versioned health check",
        "operationId": "apiV1Health",
        "responses": {
          "200": {
            "description": "API is healthy",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HealthResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/version": {
      "get": {
        "tags": ["System"],
        "summary": "API version metadata",
        "operationId": "apiV1Version",
        "responses": {
          "200": {
            "description": "API version metadata",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/VersionResponse"
                },
                "examples": {
                  "development": {
                    "value": {
                      "name": "formbuilder-backend",
                      "version": "0.1.0",
                      "env": "development"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/auth/login": {
      "post": {
        "tags": ["Auth"],
        "summary": "Login with demo credentials",
        "operationId": "authLogin",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/LoginRequest" },
              "examples": {
                "student": {
                  "value": {
                    "identifier": "FUT/2022/CSC/10428",
                    "password": "demo1234"
                  }
                },
                "librarian": {
                  "value": {
                    "identifier": "FUT/STF/LIB/0044",
                    "password": "demo1234"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Authenticated session",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/LoginResponse" }
              }
            }
          },
          "401": {
            "description": "Invalid credentials",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/me": {
      "get": {
        "tags": ["Auth"],
        "summary": "Get the current user",
        "operationId": "getCurrentUser",
        "security": [{ "bearerAuth": [] }],
        "responses": {
          "200": {
            "description": "Current user",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/MeResponse" }
              }
            }
          },
          "401": {
            "description": "Missing or invalid bearer token",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/auth/logout": {
      "post": {
        "tags": ["Auth"],
        "summary": "Logout the current session",
        "operationId": "authLogout",
        "security": [{ "bearerAuth": [] }],
        "responses": {
          "204": {
            "description": "Logged out"
          },
          "401": {
            "description": "Missing bearer token",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/dashboard": { "get": { "tags": ["Portal"], "summary": "Portal dashboard summary", "operationId": "portalDashboard", "responses": { "200": { "description": "Dashboard summary", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/AnyObject" } } } } } } },
    "/api/v1/academic/sessions": { "get": { "tags": ["Academic"], "summary": "List academic sessions", "operationId": "listAcademicSessions", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/academic/faculties": { "get": { "tags": ["Academic"], "summary": "List faculties", "operationId": "listFaculties", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/academic/departments": { "get": { "tags": ["Academic"], "summary": "List departments", "operationId": "listDepartments", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/academic/programs": { "get": { "tags": ["Academic"], "summary": "List programs", "operationId": "listPrograms", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/students": { "get": { "tags": ["Portal"], "summary": "List student profiles", "operationId": "listStudents", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/staff": { "get": { "tags": ["Portal"], "summary": "List staff profiles", "operationId": "listStaff", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/fees/invoices": { "get": { "tags": ["Finance"], "summary": "List invoices", "operationId": "listInvoices", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/fees/invoices/pay": { "post": { "tags": ["Finance"], "summary": "Pay an invoice", "operationId": "payInvoice", "security": [{ "bearerAuth": [] }], "requestBody": { "$ref": "#/components/requestBodies/MutationBody" }, "responses": { "200": { "$ref": "#/components/responses/MutationResult" } } } },
    "/api/v1/fees/payments": { "get": { "tags": ["Finance"], "summary": "List payments", "operationId": "listPayments", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/courses": { "get": { "tags": ["Academic"], "summary": "List courses", "operationId": "listCourses", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/course-registrations": { "get": { "tags": ["Academic"], "summary": "List course registrations", "operationId": "listCourseRegistrations", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } }, "post": { "tags": ["Academic"], "summary": "Submit a course registration", "operationId": "submitCourseRegistration", "security": [{ "bearerAuth": [] }], "requestBody": { "$ref": "#/components/requestBodies/MutationBody" }, "responses": { "200": { "$ref": "#/components/responses/MutationResult" } } } },
    "/api/v1/results": { "get": { "tags": ["Academic"], "summary": "List results", "operationId": "listResults", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/hostels/halls": { "get": { "tags": ["Hostels"], "summary": "List hostel halls", "operationId": "listHostelHalls", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/hostels/rooms": { "get": { "tags": ["Hostels"], "summary": "List hostel rooms", "operationId": "listHostelRooms", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/hostels/beds": { "get": { "tags": ["Hostels"], "summary": "List hostel beds", "operationId": "listHostelBeds", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/hostels/applications": { "get": { "tags": ["Hostels"], "summary": "List hostel applications", "operationId": "listHostelApplications", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } }, "post": { "tags": ["Hostels"], "summary": "Submit a hostel application", "operationId": "applyHostel", "security": [{ "bearerAuth": [] }], "requestBody": { "$ref": "#/components/requestBodies/MutationBody" }, "responses": { "200": { "$ref": "#/components/responses/MutationResult" } } } },
    "/api/v1/hostels/applications/decision": { "patch": { "tags": ["Hostels"], "summary": "Decide a hostel application", "operationId": "decideHostelApplication", "security": [{ "bearerAuth": [] }], "requestBody": { "$ref": "#/components/requestBodies/MutationBody" }, "responses": { "200": { "$ref": "#/components/responses/MutationResult" } } } },
    "/api/v1/library/books": { "get": { "tags": ["Library"], "summary": "List library books", "operationId": "listLibraryBooks", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } }, "post": { "tags": ["Library"], "summary": "Catalogue a (scanned) book", "operationId": "createLibraryBook", "security": [{ "bearerAuth": [] }], "requestBody": { "$ref": "#/components/requestBodies/MutationBody" }, "responses": { "200": { "$ref": "#/components/responses/MutationResult" } } } },
    "/api/v1/library/books/lookup": { "get": { "tags": ["Library"], "summary": "Look up a book by ISBN (catalogue, else OpenLibrary)", "operationId": "lookupLibraryBook", "security": [{ "bearerAuth": [] }], "parameters": [{ "name": "isbn", "in": "query", "required": true, "schema": { "type": "string" } }], "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/library/loans": { "get": { "tags": ["Library"], "summary": "List library loans", "operationId": "listLibraryLoans", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } }, "post": { "tags": ["Library"], "summary": "Borrow a library book", "operationId": "borrowBook", "security": [{ "bearerAuth": [] }], "requestBody": { "$ref": "#/components/requestBodies/MutationBody" }, "responses": { "200": { "$ref": "#/components/responses/MutationResult" } } } },
    "/api/v1/library/loans/scan": { "post": { "tags": ["Library"], "summary": "Checkout via scanned student QR + book ISBN (idempotent on eventId)", "operationId": "scanCheckout", "security": [{ "bearerAuth": [] }], "requestBody": { "$ref": "#/components/requestBodies/MutationBody" }, "responses": { "200": { "$ref": "#/components/responses/MutationResult" } } } },
    "/api/v1/library/loans/return-scan": { "post": { "tags": ["Library"], "summary": "Return via scanned book ISBN (idempotent on eventId)", "operationId": "scanReturn", "security": [{ "bearerAuth": [] }], "requestBody": { "$ref": "#/components/requestBodies/MutationBody" }, "responses": { "200": { "$ref": "#/components/responses/MutationResult" } } } },
    "/api/v1/library/loans/return": { "patch": { "tags": ["Library"], "summary": "Return a library loan", "operationId": "returnLibraryLoan", "security": [{ "bearerAuth": [] }], "requestBody": { "$ref": "#/components/requestBodies/MutationBody" }, "responses": { "200": { "$ref": "#/components/responses/MutationResult" } } } },
    "/api/v1/library/reservations": { "get": { "tags": ["Library"], "summary": "List library reservations", "operationId": "listLibraryReservations", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } }, "post": { "tags": ["Library"], "summary": "Reserve a library book", "operationId": "reserveBook", "security": [{ "bearerAuth": [] }], "requestBody": { "$ref": "#/components/requestBodies/MutationBody" }, "responses": { "200": { "$ref": "#/components/responses/MutationResult" } } } },
    "/api/v1/identity/qr": { "get": { "tags": ["Identity"], "summary": "Get the signed identity token for the current user (render as QR)", "operationId": "identityQR", "security": [{ "bearerAuth": [] }], "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/verify/{token}": { "get": { "tags": ["Identity"], "summary": "Verify a scanned identity/document token", "operationId": "verifyToken", "parameters": [{ "name": "token", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/clinic/patients": { "get": { "tags": ["Clinic"], "summary": "List patient records", "operationId": "listPatientRecords", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/clinic/appointments": { "get": { "tags": ["Clinic"], "summary": "List clinic appointments", "operationId": "listClinicAppointments", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } }, "post": { "tags": ["Clinic"], "summary": "Book a clinic appointment", "operationId": "bookAppointment", "security": [{ "bearerAuth": [] }], "requestBody": { "$ref": "#/components/requestBodies/MutationBody" }, "responses": { "200": { "$ref": "#/components/responses/MutationResult" } } } },
    "/api/v1/clinic/appointments/status": { "patch": { "tags": ["Clinic"], "summary": "Update clinic appointment status", "operationId": "updateAppointmentStatus", "security": [{ "bearerAuth": [] }], "requestBody": { "$ref": "#/components/requestBodies/MutationBody" }, "responses": { "200": { "$ref": "#/components/responses/MutationResult" } } } },
    "/api/v1/clinic/prescriptions": { "get": { "tags": ["Clinic"], "summary": "List prescriptions", "operationId": "listPrescriptions", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/clinic/pharmacy": { "get": { "tags": ["Clinic"], "summary": "List pharmacy inventory", "operationId": "listPharmacy", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/approvals": { "get": { "tags": ["Operations"], "summary": "List approval tasks", "operationId": "listApprovals", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/approvals/decision": { "patch": { "tags": ["Operations"], "summary": "Decide an approval task", "operationId": "decideApproval", "security": [{ "bearerAuth": [] }], "requestBody": { "$ref": "#/components/requestBodies/MutationBody" }, "responses": { "200": { "$ref": "#/components/responses/MutationResult" } } } },
    "/api/v1/notifications": { "get": { "tags": ["Operations"], "summary": "List notifications", "operationId": "listNotifications", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/notifications/read": { "patch": { "tags": ["Operations"], "summary": "Mark a notification as read", "operationId": "markNotificationRead", "security": [{ "bearerAuth": [] }], "requestBody": { "$ref": "#/components/requestBodies/MutationBody" }, "responses": { "200": { "$ref": "#/components/responses/MutationResult" } } } },
    "/api/v1/audit-logs": { "get": { "tags": ["Operations"], "summary": "List audit logs", "operationId": "listAuditLogs", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } },
    "/api/v1/support/tickets": { "get": { "tags": ["Operations"], "summary": "List support tickets", "operationId": "listSupportTickets", "responses": { "200": { "$ref": "#/components/responses/ResourceList" } } } }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer"
      }
    },
    "responses": {
      "ResourceList": {
        "description": "Resource list",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/AnyObject" }
          }
        }
      },
      "MutationResult": {
        "description": "Mutation result",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/AnyObject" }
          }
        }
      }
    },
    "requestBodies": {
      "MutationBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/AnyObject" }
          }
        }
      }
    },
    "schemas": {
      "AnyObject": {
        "type": "object",
        "additionalProperties": true
      },
      "ErrorResponse": {
        "type": "object",
        "required": ["error"],
        "properties": {
          "error": { "type": "string" }
        }
      },
      "HealthResponse": {
        "type": "object",
        "required": ["status", "time"],
        "properties": {
          "status": {
            "type": "string",
            "example": "ok"
          },
          "time": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "LoginRequest": {
        "type": "object",
        "required": ["identifier", "password"],
        "properties": {
          "identifier": { "type": "string", "example": "FUT/2022/CSC/10428" },
          "password": { "type": "string", "format": "password", "example": "demo1234" }
        }
      },
      "LoginResponse": {
        "type": "object",
        "required": ["accessToken", "tokenType", "user"],
        "properties": {
          "accessToken": { "type": "string" },
          "tokenType": { "type": "string", "example": "Bearer" },
          "user": { "$ref": "#/components/schemas/User" }
        }
      },
      "MeResponse": {
        "type": "object",
        "required": ["user"],
        "properties": {
          "user": { "$ref": "#/components/schemas/User" }
        }
      },
      "User": {
        "type": "object",
        "required": ["id", "identifier", "displayName", "email", "role", "roleLabel"],
        "properties": {
          "id": { "type": "string", "example": "usr-student" },
          "identifier": { "type": "string", "example": "FUT/2022/CSC/10428" },
          "displayName": { "type": "string", "example": "Adaeze N. Okeke" },
          "email": { "type": "string", "format": "email", "example": "student@futech.edu.ng" },
          "role": { "type": "string", "example": "student" },
          "roleLabel": { "type": "string", "example": "Student" }
        }
      },
      "VersionResponse": {
        "type": "object",
        "required": ["name", "version", "env"],
        "properties": {
          "name": {
            "type": "string",
            "example": "formbuilder-backend"
          },
          "version": {
            "type": "string",
            "example": "0.1.0"
          },
          "env": {
            "type": "string",
            "example": "development"
          }
        }
      }
    }
  }
}`
