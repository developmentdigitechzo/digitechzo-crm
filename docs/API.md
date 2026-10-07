# DigiTechzo CRM — REST API Specification & Contract

> **STATUS:** SPECIFICATION / CONTRACT ONLY  
> **Version:** 1.0.0  
> **Base URL:** `/api/v1`  
> **Protocol:** HTTPS / JSON REST  
> **Note:** This document serves as a strict API contract between frontend and backend. No endpoints are implemented in this phase.

---

## 1. Global Request & Response Conventions

### 1.1 Headers
- `Authorization: Bearer <access_token>` (Required for all protected routes)
- `Content-Type: application/json`
- `x-request-id: <uuid_v4>` (Auto-generated if omitted)

### 1.2 Standard Success Response Wrapper
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 142,
    "totalPages": 8
  }
}
```

### 1.3 Standard Error Response Wrapper
```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "INVALID_LEAD_DATA",
  "message": "Validation failed on submitted lead payload",
  "timestamp": "2026-10-05T18:30:00.000Z",
  "path": "/api/v1/leads",
  "details": [
    { "field": "primaryPhone", "issue": "Must be valid E.164 phone number" }
  ]
}
```

---

## 2. API Endpoint Matrix

### 2.1 Authentication & Profile (`/api/v1/auth`)
| Method | Route | Description | Auth Required | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate with email & password; sets refresh cookie | No | Public |
| `POST` | `/auth/refresh` | Rotate refresh token and issue new JWT access token | No (Cookie) | Public |
| `POST` | `/auth/logout` | Invalidate refresh token and clear cookie | Yes | Authenticated |
| `POST` | `/auth/forgot-password` | Request password reset token via email | No | Public |
| `POST` | `/auth/reset-password` | Reset password using valid reset token | No | Public |
| `GET` | `/auth/me` | Fetch authenticated user profile & permissions | Yes | Authenticated |

### 2.2 Users & Teams (`/api/v1/users`, `/api/v1/teams`)
| Method | Route | Description | Access Level |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | List organization users with role & status filters | `ADMIN`, `SALES_MANAGER` |
| `POST` | `/users` | Create / Invite new user | `ADMIN` |
| `GET` | `/users/:id` | Get user details | `ADMIN`, `SALES_MANAGER`, `SELF` |
| `PATCH`| `/users/:id` | Update user status, role, or profile | `ADMIN` |
| `GET` | `/teams` | List all sales & delivery teams | Authenticated |
| `POST` | `/teams` | Create new team with leader | `ADMIN` |
| `PATCH`| `/teams/:id` | Update team details or members | `ADMIN` |

### 2.3 Lead Ingestion & Public Capture (`/api/v1/leads/ingest`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/leads/ingest/webhook/meta` | Ingest lead from Meta Lead Ads webhook | Webhook Secret / Signature |
| `POST` | `/leads/ingest/webhook/google` | Ingest lead from Google Ads / Webhook | Webhook Secret |
| `POST` | `/leads/ingest/public-form` | Public website form submission endpoint | API Key / Honeypot / Rate Limited |
| `POST` | `/leads/import/csv` | Bulk lead import from uploaded CSV file | `ADMIN`, `SALES_MANAGER` |

### 2.4 Lead Management (`/api/v1/leads`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/leads` | Search & filter leads (query: `page`, `limit`, `status`, `ownerId`, `source`, `search`, `noActivity`) |
| `POST` | `/leads` | Create manual lead record |
| `GET` | `/leads/:id` | Get full lead 360 profile with contacts, owner & stage |
| `PATCH`| `/leads/:id` | Update lead contact & business details |
| `PATCH`| `/leads/:id/assign` | Assign or reassign lead owner |
| `DELETE`| `/leads/:id` | Soft-delete lead record |

### 2.5 Lead Qualification (`/api/v1/leads/:id/qualification`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/leads/:id/qualification` | Get qualification record & score for lead |
| `PUT` | `/leads/:id/qualification` | Create or update BANT qualification fields & status (`HOT`, `WARM`, `COLD`, `UNQUALIFIED`) |

### 2.6 Sales Pipeline & Deals (`/api/v1/deals`, `/api/v1/stages`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/stages` | List all pipeline stages with display order & defaults |
| `GET` | `/deals/pipeline` | Get Kanban board deals grouped by stage ID |
| `GET` | `/deals` | List deals with filtering by owner, stage, date |
| `POST` | `/deals` | Create new deal linked to a lead |
| `GET` | `/deals/:id` | Get deal details & stage history |
| `PATCH`| `/deals/:id` | Update deal title, amount, closing date |
| `PATCH`| `/deals/:id/stage` | Transition deal stage (requires `lostReasonId` if stage is `Closed-Lost`) |
| `GET` | `/deals/lost-reasons` | List standardized lost reasons |

### 2.7 Tasks & Follow-up Work Queue (`/api/v1/tasks`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/tasks/daily-queue` | Get BDE daily action queue (Overdue, Pending Calls, Today's Demos, Hot Leads) |
| `GET` | `/tasks` | List tasks with date range & status filters |
| `POST` | `/tasks` | Create scheduled task / Next Action |
| `PATCH`| `/tasks/:id/complete` | Complete task and record outcome notes |
| `PATCH`| `/tasks/:id/reschedule`| Reschedule task with new datetime & reason |

### 2.8 Communication & Activity Timeline (`/api/v1/activities`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/activities/lead/:leadId` | Get chronological activity stream for lead |
| `POST` | `/activities/call-log` | Log phone call interaction outcome & duration |
| `POST` | `/activities/note` | Add internal collaboration note |
| `POST` | `/activities/whatsapp` | Send outbound WhatsApp message |

### 2.9 Meetings & Demos (`/api/v1/meetings`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/meetings` | List scheduled meetings |
| `POST` | `/meetings` | Book new meeting/demo linked to lead/deal |
| `PATCH`| `/meetings/:id/attendance`| Record attendance (`COMPLETED`, `NO_SHOW`, etc.) & outcome notes |

### 2.10 Proposals & Quotations (`/api/v1/proposals`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/proposals` | List proposals with status filters |
| `POST` | `/proposals` | Create new proposal record & line items |
| `GET` | `/proposals/:id` | Get proposal details and revision history |
| `PATCH`| `/proposals/:id/status` | Update proposal status (`SENT`, `ACCEPTED`, `DECLINED`) |
| `POST` | `/proposals/:id/revise` | Create new revision (v2) of existing proposal |

### 2.11 Customers & Revenue Realization (`/api/v1/customers`, `/api/v1/payments`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/customers` | List active customer accounts |
| `GET` | `/customers/:id` | Get Customer 360 profile |
| `POST` | `/payments` | Record payment milestone / advance received |
| `GET` | `/payments/deal/:dealId` | Get payment milestone schedule for deal |

### 2.12 Dashboards & Analytics (`/api/v1/analytics`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/analytics/bde-summary` | Get personal daily metrics for logged-in BDE |
| `GET` | `/analytics/funnel` | Get full-funnel conversion metrics across date range |
| `GET` | `/analytics/pipeline-summary` | Get open pipeline value, weighted revenue, and stage totals |
| `GET` | `/analytics/rep-performance` | Get BDE comparison scorecard (Calls, Demos, Win Rates) |
| `GET` | `/analytics/campaign-roi` | Get lead quality and revenue per UTM source |
| `GET` | `/analytics/lost-reasons` | Get lost revenue breakdown by reason code |

### 2.13 Future Integration Webhooks (`/api/v1/integrations`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/integrations/telephony/webhook` | Inbound telephony CDR & call event webhook |
| `POST` | `/integrations/whatsapp/webhook` | Inbound WhatsApp message & status webhook |
| `POST` | `/integrations/calendar/webhook` | Google Calendar / scheduling event sync |
