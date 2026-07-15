package httpapi

import (
	"net/http"
)

func (a *API) docs(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(`<!doctype html>
<html lang="en">
  <head>
    <title>UniPortal API Reference</title>
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
    "title": "UniPortal API",
    "summary": "Backend API for the FUTECH student portal prototype.",
    "description": "## Seeded development accounts\n\nAll accounts use the password **demo1234**.\n\n| Role | Identifier |\n| --- | --- |\n| Student | FUT/2022/CSC/10428 |\n| Lecturer | FUT/STF/CSC/0391 |\n| Academic adviser | FUT/STF/CSC/0288 |\n| Head of department | FUT/STF/CSC/0102 |\n| Dean | FUT/STF/COM/0007 |\n| Exams officer | FUT/STF/EXM/0451 |\n| Bursary | FUT/STF/BUR/0319 |\n| Librarian | FUT/STF/LIB/0044 |\n| Clinic | FUT/STF/MED/0009 |\n| Hostel officer | FUT/STF/SAF/0277 |\n| Registry | FUT/STF/REG/0061 |\n| ICT administrator | FUT/STF/ICT/0015 |",
    "version": "0.1.0"
  },
  "servers": [
    {
      "url": "/",
      "description": "Current API host"
    }
  ],
  "tags": [
    {
      "name": "System",
      "description": "Health and metadata endpoints"
    },
    {
      "name": "Auth",
      "description": "Database-backed authentication with seeded development accounts"
    },
    {
      "name": "Modules",
      "description": "Deployment-level feature flags"
    },
    {
      "name": "Portal",
      "description": "Cross-module portal resources"
    },
    {
      "name": "Academic",
      "description": "Sessions, faculties, departments, programs, courses, registrations, and results"
    },
    {
      "name": "Finance",
      "description": "Invoices and payments"
    },
    {
      "name": "Hostels",
      "description": "Accommodation resources"
    },
    {
      "name": "Library",
      "description": "Library catalogue, loans, and reservations"
    },
    {
      "name": "Identity",
      "description": "Signed QR identity tokens and verification"
    },
    {
      "name": "Clinic",
      "description": "Health centre resources"
    },
    {
      "name": "Operations",
      "description": "Approvals, notifications, support, and audit logs"
    },
    {
      "name": "Generic",
      "description": "Available to any signed-in user regardless of role (or public); not specific to one portal"
    },
    {
      "name": "Role: Student",
      "description": "Endpoints the student portal calls"
    },
    {
      "name": "Role: Lecturer",
      "description": "Endpoints the lecturer portal calls"
    },
    {
      "name": "Role: Academic Adviser",
      "description": "Endpoints the academic adviser portal calls"
    },
    {
      "name": "Role: Head of Department",
      "description": "Endpoints the HOD portal calls"
    },
    {
      "name": "Role: Dean",
      "description": "Endpoints the dean portal calls"
    },
    {
      "name": "Role: Exams Officer",
      "description": "Endpoints the exams officer portal calls"
    },
    {
      "name": "Role: Bursary",
      "description": "Endpoints the bursary portal calls"
    },
    {
      "name": "Role: Librarian",
      "description": "Endpoints the librarian portal calls"
    },
    {
      "name": "Role: Clinic Staff",
      "description": "Endpoints the clinic portal calls"
    },
    {
      "name": "Role: Hostel Officer",
      "description": "Endpoints the hostel officer portal calls"
    },
    {
      "name": "Role: Registry",
      "description": "Endpoints the registry portal calls"
    },
    {
      "name": "Role: ICT Administrator",
      "description": "Endpoints the ICT administrator portal calls (ICT can act as any role)"
    }
  ],
  "paths": {
    "/healthz": {
      "get": {
        "tags": [
          "System",
          "Generic"
        ],
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
        "tags": [
          "System",
          "Generic"
        ],
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
        "tags": [
          "System",
          "Generic"
        ],
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
        "tags": [
          "Auth",
          "Generic"
        ],
        "summary": "Login with a seeded development account",
        "description": "Choose a role example below. All seeded development accounts use the password demo1234.",
        "operationId": "authLogin",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginRequest"
              },
              "examples": {
                "student": {
                  "summary": "Student",
                  "value": {
                    "identifier": "FUT/2022/CSC/10428",
                    "password": "demo1234"
                  }
                },
                "lecturer": {
                  "summary": "Lecturer",
                  "value": {
                    "identifier": "FUT/STF/CSC/0391",
                    "password": "demo1234"
                  }
                },
                "adviser": {
                  "summary": "Academic adviser",
                  "value": {
                    "identifier": "FUT/STF/CSC/0288",
                    "password": "demo1234"
                  }
                },
                "hod": {
                  "summary": "Head of department",
                  "value": {
                    "identifier": "FUT/STF/CSC/0102",
                    "password": "demo1234"
                  }
                },
                "dean": {
                  "summary": "Dean",
                  "value": {
                    "identifier": "FUT/STF/COM/0007",
                    "password": "demo1234"
                  }
                },
                "exams": {
                  "summary": "Exams officer",
                  "value": {
                    "identifier": "FUT/STF/EXM/0451",
                    "password": "demo1234"
                  }
                },
                "bursary": {
                  "summary": "Bursary",
                  "value": {
                    "identifier": "FUT/STF/BUR/0319",
                    "password": "demo1234"
                  }
                },
                "librarian": {
                  "summary": "Librarian",
                  "value": {
                    "identifier": "FUT/STF/LIB/0044",
                    "password": "demo1234"
                  }
                },
                "clinic": {
                  "summary": "Clinic",
                  "value": {
                    "identifier": "FUT/STF/MED/0009",
                    "password": "demo1234"
                  }
                },
                "hostel": {
                  "summary": "Hostel officer",
                  "value": {
                    "identifier": "FUT/STF/SAF/0277",
                    "password": "demo1234"
                  }
                },
                "registry": {
                  "summary": "Registry",
                  "value": {
                    "identifier": "FUT/STF/REG/0061",
                    "password": "demo1234"
                  }
                },
                "ict": {
                  "summary": "ICT administrator",
                  "value": {
                    "identifier": "FUT/STF/ICT/0015",
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
                "schema": {
                  "$ref": "#/components/schemas/LoginResponse"
                }
              }
            }
          },
          "401": {
            "description": "Invalid credentials",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/me": {
      "get": {
        "tags": [
          "Auth",
          "Generic"
        ],
        "summary": "Get the current user",
        "operationId": "getCurrentUser",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Current user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MeResponse"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid bearer token",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/auth/logout": {
      "post": {
        "tags": [
          "Auth",
          "Generic"
        ],
        "summary": "Logout the current session",
        "operationId": "authLogout",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "204": {
            "description": "Logged out"
          },
          "401": {
            "description": "Missing bearer token",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/dashboard": {
      "get": {
        "tags": [
          "Portal",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: Dean",
          "Role: Exams Officer",
          "Role: Bursary",
          "Role: Librarian",
          "Role: Clinic Staff",
          "Role: Hostel Officer",
          "Role: Registry",
          "Role: ICT Administrator"
        ],
        "summary": "Portal dashboard summary",
        "operationId": "portalDashboard",
        "responses": {
          "200": {
            "description": "Dashboard summary",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AnyObject"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/academic/sessions": {
      "get": {
        "tags": [
          "Academic",
          "Generic"
        ],
        "summary": "List academic sessions",
        "operationId": "listAcademicSessions",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/academic/faculties": {
      "get": {
        "tags": [
          "Academic",
          "Generic"
        ],
        "summary": "List faculties",
        "operationId": "listFaculties",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/academic/departments": {
      "get": {
        "tags": [
          "Academic",
          "Generic"
        ],
        "summary": "List departments",
        "operationId": "listDepartments",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/academic/programs": {
      "get": {
        "tags": [
          "Academic",
          "Generic"
        ],
        "summary": "List programs",
        "operationId": "listPrograms",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/students": {
      "get": {
        "tags": [
          "Portal",
          "Role: Student",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: Dean",
          "Role: Exams Officer",
          "Role: Registry",
          "Role: ICT Administrator"
        ],
        "summary": "List student profiles",
        "operationId": "listStudents",
        "parameters": [
          {
            "name": "departmentId",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Filter to one department"
          },
          {
            "name": "level",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Filter to one level, e.g. \"300\""
          },
          {
            "name": "q",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Search matric no / first name / last name"
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/students/{id}": {
      "get": {
        "tags": [
          "Portal",
          "Role: Student",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: Dean",
          "Role: Exams Officer",
          "Role: Registry",
          "Role: ICT Administrator"
        ],
        "summary": "Get a single student profile",
        "operationId": "getStudent",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Student id, or \"me\" for the calling student"
          }
        ],
        "responses": {
          "200": {
            "description": "Student profile",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AnyObject"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/students/{id}/academic-record": {
      "get": {
        "tags": [
          "Academic",
          "Role: Student",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: Dean",
          "Role: Exams Officer",
          "Role: Registry",
          "Role: ICT Administrator"
        ],
        "summary": "Computed transcript: per-semester GPA, running CGPA, and carryovers",
        "operationId": "studentAcademicRecord",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Student id, or \"me\" for the calling student"
          }
        ],
        "responses": {
          "200": {
            "description": "Academic record",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AnyObject"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/staff": {
      "get": {
        "tags": [
          "Portal",
          "Role: Lecturer",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: Dean",
          "Role: Exams Officer",
          "Role: Bursary",
          "Role: Librarian",
          "Role: Clinic Staff",
          "Role: Hostel Officer",
          "Role: Registry",
          "Role: ICT Administrator"
        ],
        "summary": "List staff profiles",
        "operationId": "listStaff",
        "parameters": [
          {
            "name": "departmentId",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Filter to one department"
          },
          {
            "name": "q",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Search staff no / display name"
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/staff/{id}": {
      "get": {
        "tags": [
          "Portal",
          "Role: Lecturer",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: Dean",
          "Role: Exams Officer",
          "Role: Bursary",
          "Role: Librarian",
          "Role: Clinic Staff",
          "Role: Hostel Officer",
          "Role: Registry",
          "Role: ICT Administrator"
        ],
        "summary": "Get a single staff profile",
        "operationId": "getStaff",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Staff id, or \"me\" for the calling staff user"
          }
        ],
        "responses": {
          "200": {
            "description": "Staff profile",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AnyObject"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/fees/invoices": {
      "get": {
        "tags": [
          "Finance",
          "Role: Student",
          "Role: Bursary",
          "Role: ICT Administrator"
        ],
        "summary": "List invoices",
        "operationId": "listInvoices",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/fees/invoices/pay": {
      "post": {
        "tags": [
          "Finance",
          "Role: Student",
          "Role: Bursary",
          "Role: ICT Administrator"
        ],
        "summary": "Pay an invoice",
        "operationId": "payInvoice",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/fees/payments": {
      "get": {
        "tags": [
          "Finance",
          "Role: Student",
          "Role: Bursary",
          "Role: ICT Administrator"
        ],
        "summary": "List payments",
        "operationId": "listPayments",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/courses": {
      "get": {
        "tags": [
          "Academic",
          "Generic"
        ],
        "summary": "List courses",
        "operationId": "listCourses",
        "parameters": [
          {
            "name": "departmentId",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Filter to one department"
          },
          {
            "name": "level",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Filter to one level, e.g. \"300\""
          },
          {
            "name": "semester",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Filter to one semester, e.g. \"First\""
          },
          {
            "name": "q",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Search course code / title"
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/courses/{id}": {
      "get": {
        "tags": [
          "Academic",
          "Generic"
        ],
        "summary": "Get a single course",
        "operationId": "getCourse",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Course",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AnyObject"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/course-registrations": {
      "get": {
        "tags": [
          "Academic",
          "Role: Student",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: ICT Administrator"
        ],
        "summary": "List course registrations",
        "operationId": "listCourseRegistrations",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      },
      "post": {
        "tags": [
          "Academic",
          "Role: Student",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: ICT Administrator"
        ],
        "summary": "Submit a course registration",
        "operationId": "submitCourseRegistration",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/course-registrations/decision": {
      "patch": {
        "tags": [
          "Academic",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: ICT Administrator"
        ],
        "summary": "Approve or query a pending course registration (adviser/HOD)",
        "operationId": "decideCourseRegistration",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/results": {
      "get": {
        "tags": [
          "Academic",
          "Role: Student",
          "Role: Lecturer",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: Dean",
          "Role: Exams Officer",
          "Role: ICT Administrator"
        ],
        "summary": "List results",
        "operationId": "listResults",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/hostels/halls": {
      "get": {
        "tags": [
          "Hostels",
          "Generic"
        ],
        "summary": "List hostel halls",
        "operationId": "listHostelHalls",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/hostels/rooms": {
      "get": {
        "tags": [
          "Hostels",
          "Generic"
        ],
        "summary": "List hostel rooms",
        "operationId": "listHostelRooms",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/hostels/beds": {
      "get": {
        "tags": [
          "Hostels",
          "Role: Hostel Officer",
          "Role: ICT Administrator"
        ],
        "summary": "List hostel beds",
        "operationId": "listHostelBeds",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/hostels/applications": {
      "get": {
        "tags": [
          "Hostels",
          "Role: Student",
          "Role: Hostel Officer",
          "Role: ICT Administrator"
        ],
        "summary": "List hostel applications",
        "operationId": "listHostelApplications",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      },
      "post": {
        "tags": [
          "Hostels",
          "Role: Student",
          "Role: Hostel Officer",
          "Role: ICT Administrator"
        ],
        "summary": "Submit a hostel application",
        "operationId": "applyHostel",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/hostels/applications/decision": {
      "patch": {
        "tags": [
          "Hostels",
          "Role: Hostel Officer",
          "Role: ICT Administrator"
        ],
        "summary": "Decide a hostel application",
        "operationId": "decideHostelApplication",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/library/books": {
      "get": {
        "tags": [
          "Library",
          "Generic"
        ],
        "summary": "List library books",
        "operationId": "listLibraryBooks",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      },
      "post": {
        "tags": [
          "Library",
          "Role: Librarian",
          "Role: ICT Administrator"
        ],
        "summary": "Catalogue a (scanned) book",
        "operationId": "createLibraryBook",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/library/books/lookup": {
      "get": {
        "tags": [
          "Library",
          "Role: Librarian",
          "Role: ICT Administrator"
        ],
        "summary": "Look up a book by ISBN (catalogue, else OpenLibrary)",
        "operationId": "lookupLibraryBook",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "isbn",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/library/loans": {
      "get": {
        "tags": [
          "Library",
          "Role: Student",
          "Role: Librarian",
          "Role: ICT Administrator"
        ],
        "summary": "List library loans",
        "operationId": "listLibraryLoans",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      },
      "post": {
        "tags": [
          "Library",
          "Role: Student",
          "Role: Librarian",
          "Role: ICT Administrator"
        ],
        "summary": "Borrow a library book",
        "operationId": "borrowBook",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/library/loans/scan": {
      "post": {
        "tags": [
          "Library",
          "Role: Librarian",
          "Role: ICT Administrator"
        ],
        "summary": "Checkout via scanned student QR + book ISBN (idempotent on eventId)",
        "operationId": "scanCheckout",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/library/loans/return-scan": {
      "post": {
        "tags": [
          "Library",
          "Role: Librarian",
          "Role: ICT Administrator"
        ],
        "summary": "Return via scanned book ISBN (idempotent on eventId)",
        "operationId": "scanReturn",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/library/loans/return": {
      "patch": {
        "tags": [
          "Library",
          "Role: Student",
          "Role: Librarian",
          "Role: ICT Administrator"
        ],
        "summary": "Return a library loan",
        "operationId": "returnLibraryLoan",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/library/reservations": {
      "get": {
        "tags": [
          "Library",
          "Role: Student",
          "Role: Librarian",
          "Role: ICT Administrator"
        ],
        "summary": "List library reservations",
        "operationId": "listLibraryReservations",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      },
      "post": {
        "tags": [
          "Library",
          "Role: Student",
          "Role: Librarian",
          "Role: ICT Administrator"
        ],
        "summary": "Reserve a library book",
        "operationId": "reserveBook",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/identity/qr": {
      "get": {
        "tags": [
          "Identity",
          "Generic"
        ],
        "summary": "Get the signed identity token for the current user (render as QR)",
        "operationId": "identityQR",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/verify/{token}": {
      "get": {
        "tags": [
          "Identity",
          "Generic"
        ],
        "summary": "Verify a scanned identity/document token",
        "operationId": "verifyToken",
        "parameters": [
          {
            "name": "token",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/clinic/patients": {
      "get": {
        "tags": [
          "Clinic",
          "Role: Clinic Staff",
          "Role: ICT Administrator"
        ],
        "summary": "List patient records",
        "operationId": "listPatientRecords",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/clinic/appointments": {
      "get": {
        "tags": [
          "Clinic",
          "Role: Student",
          "Role: Clinic Staff",
          "Role: ICT Administrator"
        ],
        "summary": "List clinic appointments",
        "operationId": "listClinicAppointments",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      },
      "post": {
        "tags": [
          "Clinic",
          "Role: Student",
          "Role: Clinic Staff",
          "Role: ICT Administrator"
        ],
        "summary": "Book a clinic appointment",
        "operationId": "bookAppointment",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/clinic/appointments/status": {
      "patch": {
        "tags": [
          "Clinic",
          "Role: Student",
          "Role: Clinic Staff",
          "Role: ICT Administrator"
        ],
        "summary": "Update clinic appointment status",
        "operationId": "updateAppointmentStatus",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/clinic/prescriptions": {
      "get": {
        "tags": [
          "Clinic",
          "Role: Clinic Staff",
          "Role: ICT Administrator"
        ],
        "summary": "List prescriptions",
        "operationId": "listPrescriptions",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/clinic/pharmacy": {
      "get": {
        "tags": [
          "Clinic",
          "Role: Clinic Staff",
          "Role: ICT Administrator"
        ],
        "summary": "List pharmacy inventory",
        "operationId": "listPharmacy",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/approvals": {
      "get": {
        "tags": [
          "Operations",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: Dean",
          "Role: Exams Officer",
          "Role: Bursary",
          "Role: Hostel Officer",
          "Role: Registry",
          "Role: ICT Administrator"
        ],
        "summary": "List approval tasks",
        "operationId": "listApprovals",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/approvals/decision": {
      "patch": {
        "tags": [
          "Operations",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: Dean",
          "Role: Exams Officer",
          "Role: Bursary",
          "Role: Hostel Officer",
          "Role: Registry",
          "Role: ICT Administrator"
        ],
        "summary": "Decide an approval task",
        "operationId": "decideApproval",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/notifications": {
      "get": {
        "tags": [
          "Operations",
          "Generic"
        ],
        "summary": "List notifications",
        "operationId": "listNotifications",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/notifications/read": {
      "patch": {
        "tags": [
          "Operations",
          "Generic"
        ],
        "summary": "Mark a notification as read",
        "operationId": "markNotificationRead",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/audit-logs": {
      "get": {
        "tags": [
          "Operations",
          "Role: ICT Administrator"
        ],
        "summary": "List audit logs",
        "operationId": "listAuditLogs",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/support/tickets": {
      "get": {
        "tags": [
          "Operations",
          "Role: Student",
          "Role: Registry",
          "Role: ICT Administrator"
        ],
        "summary": "List support tickets",
        "operationId": "listSupportTickets",
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/results/submit": {
      "post": {
        "tags": [
          "Academic",
          "Role: Lecturer",
          "Role: ICT Administrator"
        ],
        "summary": "Lecturer submits a course's draft results for a session",
        "operationId": "submitResults",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { courseId, sessionId }. Transitions that course+session's draft results to submitted.",
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/results/decision": {
      "patch": {
        "tags": [
          "Academic",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: Dean",
          "Role: Exams Officer",
          "Role: ICT Administrator"
        ],
        "summary": "Approve a submitted result sheet, or query it back to the lecturer",
        "operationId": "decideResults",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { courseId, sessionId, status: \"approved\"|\"query\", note }.",
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/results/condone": {
      "post": {
        "tags": [
          "Academic",
          "Role: Head of Department",
          "Role: Dean",
          "Role: Exams Officer",
          "Role: ICT Administrator"
        ],
        "summary": "Condone a borderline-F result (total 38-39)",
        "operationId": "condoneResult",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { resultId }. Excludes the result from the carryover list without changing the grade.",
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/workflow-stages": {
      "get": {
        "tags": [
          "Academic",
          "Generic"
        ],
        "summary": "List the configured results review chain (default: HOD, then Dean)",
        "operationId": "getWorkflowStages",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Workflow stages",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AnyObject"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Academic",
          "Role: ICT Administrator"
        ],
        "summary": "Replace the results review chain (ICT only)",
        "operationId": "setWorkflowStages",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { stages: [{ position, roles: [role, ...], label }] }. A stage with more than one role is a board — every listed role must approve before it clears.",
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/level-review-progress": {
      "get": {
        "tags": [
          "Academic",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: Dean",
          "Role: Exams Officer",
          "Role: Registry",
          "Role: ICT Administrator"
        ],
        "summary": "List department+level+session cohorts and where they sit in the review chain",
        "operationId": "listLevelReviewProgress",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "departmentId",
            "in": "query",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "sessionId",
            "in": "query",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      }
    },
    "/api/v1/level-review-progress/compile": {
      "post": {
        "tags": [
          "Academic",
          "Role: Head of Department",
          "Role: Exams Officer",
          "Role: ICT Administrator"
        ],
        "summary": "Open the review chain for a department+level+session cohort",
        "operationId": "compileLevel",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { departmentId, level, sessionId }. Every result for the cohort must already be approved.",
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/level-review-progress/decision": {
      "patch": {
        "tags": [
          "Academic",
          "Role: Head of Department",
          "Role: Dean",
          "Role: ICT Administrator"
        ],
        "summary": "Record the caller's approval (or query) at the cohort's current review stage",
        "operationId": "decideLevelStage",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { id, status: \"approved\"|\"queried\" }. The caller's role must be one of the current stage's required roles; a board stage needs every required role to approve before it advances.",
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/level-review-progress/publish": {
      "post": {
        "tags": [
          "Academic",
          "Role: Exams Officer",
          "Role: Registry",
          "Role: ICT Administrator"
        ],
        "summary": "Publish a cohort once its review chain is cleared",
        "operationId": "publishLevel",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { id }. Releases every approved result for the cohort so it shows up in transcripts.",
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/student-cases": {
      "get": {
        "tags": [
          "Academic",
          "Role: Student",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: Dean",
          "Role: Exams Officer",
          "Role: Registry",
          "Role: ICT Administrator"
        ],
        "summary": "List student cases (deferment, absconded, suspended, dex, teaching practice)",
        "operationId": "listStudentCases",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "A student sees only their own cases; staff roles see any, optionally filtered.",
        "parameters": [
          {
            "name": "studentId",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Staff-only filter; ignored for a student caller (always scoped to self)"
          },
          {
            "name": "type",
            "in": "query",
            "schema": {
              "type": "string",
              "enum": [
                "deferment",
                "absconded",
                "suspended",
                "dex",
                "teaching_practice"
              ]
            }
          },
          {
            "name": "status",
            "in": "query",
            "schema": {
              "type": "string",
              "enum": [
                "flagged",
                "approved",
                "declined"
              ]
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      },
      "post": {
        "tags": [
          "Academic",
          "Role: Student",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: Registry",
          "Role: ICT Administrator"
        ],
        "summary": "Raise a student case",
        "operationId": "raiseStudentCase",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { studentId, sessionId, level, type, reason, details, attachmentId }. Only type \"deferment\" may carry an attachment. A student raises for themselves; staff raise on a student's behalf.",
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/student-cases/decision": {
      "patch": {
        "tags": [
          "Academic",
          "Role: Head of Department",
          "Role: Dean",
          "Role: Registry",
          "Role: ICT Administrator"
        ],
        "summary": "Approve or decline a flagged student case",
        "operationId": "decideStudentCase",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { id, status: \"approved\"|\"declined\" }.",
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/courses/{id}/roster": {
      "get": {
        "tags": [
          "Academic",
          "Role: Lecturer",
          "Role: ICT Administrator"
        ],
        "summary": "List a course's roster with each student's current score",
        "operationId": "getCourseRoster",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Roster",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AnyObject"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/courses/{id}/roster/score": {
      "patch": {
        "tags": [
          "Academic",
          "Role: Lecturer",
          "Role: ICT Administrator"
        ],
        "summary": "Set one student's CA or exam score for a course+session",
        "operationId": "upsertScore",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { studentId, sessionId, field: \"ca\"|\"exam\", value }. Locked once the sheet has been submitted for review.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/courses/{id}/assignments": {
      "get": {
        "tags": [
          "Academic",
          "Generic"
        ],
        "summary": "List a course's assignments",
        "operationId": "listCourseAssignments",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      },
      "post": {
        "tags": [
          "Academic",
          "Role: Lecturer",
          "Role: ICT Administrator"
        ],
        "summary": "Create an assignment for a course",
        "operationId": "createAssignment",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { title, dueAt (RFC3339), points, instructions }.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/assignments/{id}/submissions": {
      "get": {
        "tags": [
          "Academic",
          "Role: Lecturer",
          "Role: ICT Administrator"
        ],
        "summary": "List every student's submission for an assignment (grading view)",
        "operationId": "listAssignmentSubmissions",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      },
      "post": {
        "tags": [
          "Academic",
          "Role: Student"
        ],
        "summary": "Submit (or resubmit) your own work for an assignment",
        "operationId": "submitAssignment",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { fileName, note }. Resubmission is blocked once the lecturer has graded it.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/assignment-submissions/{id}/grade": {
      "patch": {
        "tags": [
          "Academic",
          "Role: Lecturer",
          "Role: ICT Administrator"
        ],
        "summary": "Grade a student's assignment submission",
        "operationId": "gradeSubmission",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { grade, feedback }.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/courses/{id}/materials": {
      "get": {
        "tags": [
          "Academic",
          "Generic"
        ],
        "summary": "List a course's shared materials",
        "operationId": "listCourseMaterials",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      },
      "post": {
        "tags": [
          "Academic",
          "Role: Lecturer",
          "Role: ICT Administrator"
        ],
        "summary": "Share a material with a course (metadata only, no file storage yet)",
        "operationId": "addCourseMaterial",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { name, fileType, sizeLabel }.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/courses/{id}/posts": {
      "get": {
        "tags": [
          "Academic",
          "Generic"
        ],
        "summary": "List a course's announcement stream",
        "operationId": "listCoursePosts",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      },
      "post": {
        "tags": [
          "Academic",
          "Role: Lecturer",
          "Role: Student",
          "Role: ICT Administrator"
        ],
        "summary": "Post an announcement to a course",
        "operationId": "addCoursePost",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { body }. The course's lecturer can always post; a student may only post if they're the recognized class rep for that course's department+level cohort.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/class-reps": {
      "get": {
        "tags": [
          "Academic",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: ICT Administrator"
        ],
        "summary": "List class rep assignments",
        "operationId": "listClassReps",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "departmentId",
            "in": "query",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "sessionId",
            "in": "query",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "offset",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/components/responses/ResourceList"
          }
        }
      },
      "post": {
        "tags": [
          "Academic",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: ICT Administrator"
        ],
        "summary": "Recognize a student as the class rep for a department+level+session cohort",
        "operationId": "assignClassRep",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { departmentId, level, sessionId, studentId }.",
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    },
    "/api/v1/class-reps/revoke": {
      "post": {
        "tags": [
          "Academic",
          "Role: Academic Adviser",
          "Role: Head of Department",
          "Role: ICT Administrator"
        ],
        "summary": "Revoke a class rep assignment",
        "operationId": "revokeClassRep",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Body: { departmentId, level, sessionId, studentId }.",
        "requestBody": {
          "$ref": "#/components/requestBodies/MutationBody"
        },
        "responses": {
          "200": {
            "$ref": "#/components/responses/MutationResult"
          }
        }
      }
    }
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
            "schema": {
              "$ref": "#/components/schemas/AnyObject"
            }
          }
        }
      },
      "MutationResult": {
        "description": "Mutation result",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/AnyObject"
            }
          }
        }
      }
    },
    "requestBodies": {
      "MutationBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/AnyObject"
            }
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
        "required": [
          "error"
        ],
        "properties": {
          "error": {
            "type": "string"
          }
        }
      },
      "HealthResponse": {
        "type": "object",
        "required": [
          "status",
          "time"
        ],
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
        "required": [
          "identifier",
          "password"
        ],
        "properties": {
          "identifier": {
            "type": "string",
            "example": "FUT/2022/CSC/10428"
          },
          "password": {
            "type": "string",
            "format": "password",
            "example": "demo1234"
          }
        }
      },
      "LoginResponse": {
        "type": "object",
        "required": [
          "accessToken",
          "tokenType",
          "user"
        ],
        "properties": {
          "accessToken": {
            "type": "string"
          },
          "tokenType": {
            "type": "string",
            "example": "Bearer"
          },
          "user": {
            "$ref": "#/components/schemas/User"
          }
        }
      },
      "MeResponse": {
        "type": "object",
        "required": [
          "user"
        ],
        "properties": {
          "user": {
            "$ref": "#/components/schemas/User"
          }
        }
      },
      "User": {
        "type": "object",
        "required": [
          "id",
          "identifier",
          "displayName",
          "email",
          "role",
          "roleLabel"
        ],
        "properties": {
          "id": {
            "type": "string",
            "example": "usr-student"
          },
          "identifier": {
            "type": "string",
            "example": "FUT/2022/CSC/10428"
          },
          "displayName": {
            "type": "string",
            "example": "Adaeze N. Okeke"
          },
          "email": {
            "type": "string",
            "format": "email",
            "example": "student@futech.edu.ng"
          },
          "role": {
            "type": "string",
            "example": "student"
          },
          "roleLabel": {
            "type": "string",
            "example": "Student"
          }
        }
      },
      "VersionResponse": {
        "type": "object",
        "required": [
          "name",
          "version",
          "env"
        ],
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
  },
  "x-tagGroups": [
    {
      "name": "Generic (any signed-in user)",
      "tags": [
        "Generic"
      ]
    },
    {
      "name": "Student Portal",
      "tags": [
        "Role: Student"
      ]
    },
    {
      "name": "Lecturer Portal",
      "tags": [
        "Role: Lecturer"
      ]
    },
    {
      "name": "Academic Adviser Portal",
      "tags": [
        "Role: Academic Adviser"
      ]
    },
    {
      "name": "Head of Department Portal",
      "tags": [
        "Role: Head of Department"
      ]
    },
    {
      "name": "Dean Portal",
      "tags": [
        "Role: Dean"
      ]
    },
    {
      "name": "Exams Officer Portal",
      "tags": [
        "Role: Exams Officer"
      ]
    },
    {
      "name": "Bursary Portal",
      "tags": [
        "Role: Bursary"
      ]
    },
    {
      "name": "Librarian Portal",
      "tags": [
        "Role: Librarian"
      ]
    },
    {
      "name": "Clinic Portal",
      "tags": [
        "Role: Clinic Staff"
      ]
    },
    {
      "name": "Hostel Officer Portal",
      "tags": [
        "Role: Hostel Officer"
      ]
    },
    {
      "name": "Registry Portal",
      "tags": [
        "Role: Registry"
      ]
    },
    {
      "name": "ICT Administrator Portal",
      "tags": [
        "Role: ICT Administrator"
      ]
    },
    {
      "name": "By Subsystem (reference)",
      "tags": [
        "System",
        "Auth",
        "Modules",
        "Portal",
        "Academic",
        "Finance",
        "Hostels",
        "Library",
        "Identity",
        "Clinic",
        "Operations"
      ]
    }
  ]
}`
