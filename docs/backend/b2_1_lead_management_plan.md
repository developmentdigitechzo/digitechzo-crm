# Step B2.1 — Lead Management Backend Implementation Plan

> **STATUS:** SPECIFICATION / ARCHITECTURE PLAN ONLY (REVISED)  
> **Module:** B2.1 — Lead Management (Domain Core)  
> **Target Subsystem:** `apps/api/src/modules/leads/`  
> **Database Targets:** `leads`, `lead_qualifications`  
> **API Base Route:** `/api/v1/leads`  
> **Rule:** Planning only. Zero code, zero migrations, zero frontend modifications.

---

## 1. Scope & Objective

Step **B2.1** establishes the foundational CRM domain entity: **Lead Management**. It enables capturing, querying, filtering, assigning, qualifying, and transitioning prospective client inquiries within a strictly isolated multi-tenant architecture.

### In Scope for B2.1:
- Core `Lead` and `LeadQualification` database models with Prisma.
- Multi-tenant tenant boundary enforcement (`organizationId`).
- Ownership and assignment governance (Rule `BR-OWN-01`).
- Clear separation of **Lead Lifecycle Status** (`NEW`, `CONTACTED`, `QUALIFIED`, `UNQUALIFIED`, `CONVERTED`, `LOST`) from **Lead Priority** (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and optional **Temperature** (`HOT`, `WARM`, `COLD`).
- Structured BANT qualification data capture (Budget, Authority, Need, Timeline).
- REST API endpoints for listing (paginated, filtered, searched), retrieving, creating, updating, assigning, status transitioning, and qualifying leads.
- Full DTO validation (E.164 phone normalization, email sanitization, enum enforcement).
- Compatibility mapping for the frozen E1 frontend (`src/pages/leads/LeadsPage.tsx`).
- Role-based visibility enforcement (Scoped BDE visibility vs Organization-wide Manager/Admin visibility).
- Immutable security audit logging via B1 `AuditService`.

### Strictly Out of Scope for B2.1 (Boundary Invariants):
B2.1 does **NOT** create, migrate, or implement:
- **Deals & Pipeline Stages on Leads** (deferred to **B2.2**).
- **Tasks & Task Kanban** (deferred to **B2.3**).
- **Activity Timeline & Chronological Notes** (deferred to **B2.4**).
- **Meetings & Calls** (deferred to **B2.5**).
- **Proposals & Quotes** (deferred to **B2.6**).
- **Customer Conversion Records** (deferred to **B2.7**).
- **WhatsApp Tables & Cloud API Integration** (deferred to **B3**).
- **Telephony Tables & Call Recordings** (deferred to **B3**).
- **Email Ingestion / SMTP Engine** (deferred to **B3**).
- **Meta Ads Webhooks & Google Ads Ingestion** (deferred to **B3**).
- **Object Storage / File Attachments** (deferred to **B3**).
- **AI Scoring / ML Routing Models** (deferred to **B4**).

---

## 2. Existing E1 Frontend Compatibility Analysis

An inspection of `src/types/crm.ts`, `src/mocks/mockData.ts`, and `src/pages/leads/LeadsPage.tsx` establishes the exact data contracts expected by the approved frontend:

### 2.1 E1 Contract vs Clean Backend Architecture

In the initial frontend prototype (E1), the `status` field combined lifecycle and temperature (`NEW`, `HOT`, `WARM`, `COLD`, `UNQUALIFIED`, `CONVERTED`, `LOST`), and did not include a dedicated `priority` field.

To maintain clean enterprise domain modeling while preserving 100% non-breaking compatibility with the frozen E1 frontend:

1. **Backend Persisted Models:**
   - `status`: Pure sales lifecycle (`NEW`, `CONTACTED`, `QUALIFIED`, `UNQUALIFIED`, `CONVERTED`, `LOST`).
   - `priority`: Commercial urgency (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
   - `temperature`: Optional commercial temperature (`HOT`, `WARM`, `COLD`, Nullable).
2. **DTO Compatibility Layer:**
   - Outgoing DTOs to the frontend supply `status`, `priority`, and `temperature`.
   - If E1 frontend reads `status`, the DTO adapter can surface the temperature or lifecycle value as required, or provide a synthesized `status` field so E1 filter pills (`HOT`, `WARM`, `COLD`) function without touching a single line of frozen frontend code.

### 2.2 Field Mapping & Persistence Matrix

| E1 Frontend Property | Type in `src/types/crm.ts` | Backend Persistence Strategy | Classification |
| :--- | :--- | :--- | :--- |
| `id` | `string` | `Lead.id` (UUID Primary Key) | **Persisted (Mandatory)** |
| `fullName` | `string` | `Lead.fullName` (`VARCHAR(150)`) | **Persisted (Mandatory)** |
| `companyName` | `string \| undefined` | `Lead.companyName` (`VARCHAR(150)`, Nullable) | **Persisted (Optional)** |
| `title` | `string \| undefined` | `Lead.title` (`VARCHAR(100)`, Nullable) | **Persisted (Optional)** |
| `phone` | `string` | `Lead.phone` (Normalized E.164 format) | **Persisted (Mandatory)** |
| `email` | `string` | `Lead.email` (Normalized lowercase) | **Persisted (Mandatory)** |
| `source` | `LeadSource` | `Lead.source` (`VARCHAR(50)`, Enum) | **Persisted (Mandatory, Immutable)** |
| `status` | `LeadStatus` | `Lead.status` (`VARCHAR(30)`, Default: `NEW`) | **Persisted (Lifecycle)** |
| `priority` | `TaskPriority` (in tasks) | `Lead.priority` (`VARCHAR(20)`, Default: `MEDIUM`) | **Persisted (Priority)** |
| `temperature` | N/A (merged in E1) | `Lead.temperature` (`VARCHAR(20)`, Nullable) | **Persisted (Optional Temperature)** |
| `leadScore` | `number` | `Lead.leadScore` (`INTEGER`, Nullable, 0–100) | **Persisted (Score)** |
| `serviceInterest` | `string` | `Lead.serviceInterest` (`VARCHAR(200)`) | **Persisted (Mandatory)** |
| `ownerId` | `string` | `Lead.ownerId` (UUID FK -> `users.id`) | **Persisted (Mandatory)** |
| `ownerName` | `string` | *Derived* via SQL relation `Lead.owner.name` | **Derived / DTO Joined** |
| `lastActivityAt` | `string` (ISO) | `Lead.lastActivityAt` (`TIMESTAMP`, Default: `now()`) | **Persisted (Mandatory)** |
| `createdAt` | `string` (ISO) | `Lead.createdAt` (`TIMESTAMP`, Default: `now()`) | **Persisted (System)** |
| `nextAction` | `NextAction \| undefined` | Stored as lightweight milestone columns on `Lead` | **Persisted / DTO Transformed** |

---

## 3. Domain Model Architecture

```
                    ┌─────────────────────────┐
                    │      Organization       │ (B1 Root Tenant)
                    └────────────┬────────────┘
                                 │ 1:N
                                 ▼
┌──────────────────┐ 1:N    ┌─────────┐ 1:1    ┌──────────────────────┐
│       User       ├───────►│  Lead   ├───────►│  LeadQualification   │
│   (B1 Account)   │ (Owner)└────┬────┘        │    (BANT Details)    │
└──────────────────┘             │             └──────────────────────┘
                                 │ 1:N
                                 ▼
                    ┌─────────────────────────┐
                    │        AuditLog         │ (B1 Security Trail)
                    └─────────────────────────┘
```

---

## 4. Proposed Prisma Schema (PostgreSQL DDL)

To be incorporated into `apps/api/prisma/schema.prisma` in Step B2.1:

```prisma
model Lead {
  id                String             @id @default(uuid())
  organizationId    String             @map("organization_id")
  ownerId           String             @map("owner_id")
  fullName          String             @map("full_name")
  companyName       String?            @map("company_name")
  title             String?
  phone             String
  email             String
  source            String             // META_ADS, GOOGLE_ADS, WEBSITE_FORM, WHATSAPP, MANUAL, IMPORT, PHONE_INBOUND
  
  // Separation of Lifecycle Status, Priority, and Temperature
  status            String             @default("NEW") // NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED, LOST
  priority          String             @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  temperature       String?            // HOT, WARM, COLD (Optional)
  
  // Scoring
  leadScore         Int?               @map("lead_score") // Nullable, range 0–100
  serviceInterest   String             @map("service_interest")
  
  // Unqualification Governance (BR-QUAL-03)
  unqualifiedReason String?            @map("unqualified_reason")
  unqualifiedNotes  String?            @map("unqualified_notes")
  
  // Lightweight Lead-Level Next Action Snapshot (BR-ACT-01)
  lastActivityAt    DateTime           @default(now()) @map("last_activity_at")
  nextActionDueAt   DateTime?          @map("next_action_due_at")
  nextActionType    String?            @map("next_action_type") // CALL, WHATSAPP, EMAIL, MEETING, PROPOSAL, INTERNAL_REVIEW
  nextActionPurpose String?            @map("next_action_purpose")
  nextActionOwnerId String?            @map("next_action_owner_id")
  
  // Soft Deletion
  deletedAt         DateTime?          @map("deleted_at")
  createdAt         DateTime           @default(now()) @map("created_at")
  updatedAt         DateTime           @updatedAt @map("updated_at")

  // Relations
  organization      Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  owner             User               @relation("LeadOwner", fields: [ownerId], references: [id], onDelete: Restrict)
  nextActionOwner   User?              @relation("LeadNextActionOwner", fields: [nextActionOwnerId], references: [id], onDelete: SetNull)
  qualification     LeadQualification?

  @@index([organizationId])
  @@index([ownerId])
  @@index([status])
  @@index([priority])
  @@index([source])
  @@index([phone])
  @@index([email])
  @@index([createdAt])
  @@index([lastActivityAt])
  @@index([nextActionDueAt])
  @@map("leads")
}

model LeadQualification {
  id                String       @id @default(uuid())
  leadId            String       @unique @map("lead_id")
  
  // Structured BANT Criteria (BR-QUAL-01)
  budgetAmount      Decimal?     @map("budget_amount") @db.Decimal(12, 2)
  budgetStatus      String?      @map("budget_status") // CONFIRMED, ESTIMATED, EXPLORING, NO_BUDGET
  authorityLevel    String?      @map("authority_level") // DECISION_MAKER, INFLUENCER, EVALUATOR, GATEKEEPER
  timelineHorizon   String?      @map("timeline_horizon") // IMMEDIATE_2WEEKS, ONE_MONTH, THREE_MONTHS, EXPLORING
  urgencyRating     Int?         @default(3) @map("urgency_rating") // 1 to 5
  problemStatement  String?      @map("problem_statement") @db.Text
  notes             String?      @db.Text
  
  qualifiedByUserId String?      @map("qualified_by_user_id")
  qualifiedAt       DateTime     @default(now()) @map("qualified_at")
  updatedAt         DateTime     @updatedAt @map("updated_at")

  lead              Lead         @relation(fields: [leadId], references: [id], onDelete: Cascade)
  qualifiedByUser   User?        @relation("LeadQualifier", fields: [qualifiedByUserId], references: [id], onDelete: SetNull)

  @@index([leadId])
  @@map("lead_qualifications")
}
```

### Updates to B1 Models:
- `Organization`: Add `leads Lead[]`
- `User`: Add `ownedLeads Lead[] @relation("LeadOwner")`, `nextActionLeads Lead[] @relation("LeadNextActionOwner")`, `qualifiedLeads LeadQualification[] @relation("LeadQualifier")`.
- Zero columns modified or dropped in any existing B1 table.

---

## 5. Database & Index Design Rationale

1. **`organization_id` Index:** Multi-tenant isolation. Every query scopes by `WHERE organization_id = :orgId`.
2. **`owner_id` Index:** Enables fast filtering for rep dashboards ("My Leads").
3. **`status` & `priority` Indexes:** Supports faceted search and filter tabs.
4. **`source` Index:** Supports marketing attribution filter dropdown.
5. **`phone` & `email` Indexes:** Required for high-performance deduplication checks (`BR-DEDUP-01`).
6. **`last_activity_at` Index:** Enables inactivity monitoring (24h/48h alert triggers under `BR-INACT-01`).
7. **`next_action_due_at` Index:** Powers sorting follow-up queues and detecting overdue actions (`BR-ACT-01`, `BR-FOL-01`).

---

## 6. Lead Lifecycle Status vs Priority vs Temperature

### 6.1 Lead Lifecycle Status (`status`)
Reflects the operational phase in the sales qualification pipeline:
- `NEW`: Ingested inquiry, uncontacted.
- `CONTACTED`: Initial outreach conducted (call/WhatsApp/email logged).
- `QUALIFIED`: Validated BANT criteria; ready for Deal creation.
- `UNQUALIFIED`: Not a commercial fit (requires `unqualifiedReason`).
- `CONVERTED`: Advanced to active Pipeline Deal (handled in B2.2).
- `LOST`: Prospect opted out or ghosted prior to qualification/deal.

### 6.2 Lead Priority (`priority`)
Reflects the commercial SLA urgency for follow-up:
- `LOW`: Low urgency / long timeline.
- `MEDIUM`: Standard commercial inquiry (Default).
- `HIGH`: Time-sensitive requirement / high budget.
- `URGENT`: Immediate SLA requirement (inbound hot trigger, callback request).

### 6.3 Optional Temperature (`temperature`)
Preserves optional legacy compatibility with E1:
- `HOT`, `WARM`, `COLD` (Nullable).

---

## 7. BDE Authorization & Scoped Visibility Rules

To prevent unrestricted data exposure while supporting managerial governance:

### 7.1 Visibility Rules Matrix
- **`ADMIN` / `MANAGER`:**
  - Has organization-wide visibility across all leads in the tenant.
  - Can view, filter, and reassign any lead in their organization.
  - SQL Scope: `WHERE organization_id = req.user.organizationId AND deleted_at IS NULL`.
- **`BDE_SALES`:**
  - Restricted by default to **leads assigned to the authenticated user**.
  - SQL Scope: `WHERE organization_id = req.user.organizationId AND owner_id = req.user.userId AND deleted_at IS NULL`.
  - Attempting to access or update another rep's lead returns `404 Not Found`.
- **Future Extension Recommendation:**
  - If organization-wide visibility is ever desired for senior BDEs, introduce an explicit permission `leads:read_all`.
  - **Not introduced in B2.1** to keep authorization strict and secure by default.

---

## 8. Deduplication Architecture

1. **Manual Entry (`POST /api/v1/leads`):**
   - Normalizes phone (E.164) and email (lowercase trimmed).
   - Queries `leads` where `organization_id = :orgId AND deleted_at IS NULL AND (phone = :phone OR email = :email)`.
   - If an active matching lead exists, the API rejects creation with `409 Conflict` ("A lead with this phone or email already exists in the organization").
2. **Future Ingestion Architecture (Integration Roadmap):**
   - When webhooks and public forms are added in B3, deduplication will be organization-scoped.
   - Rather than creating duplicate lead rows, inbound webhooks with matching contacts will append an interaction/inquiry activity to the existing lead timeline and notify the lead owner.

---

## 9. Lead Score Design (MVP)

- Field: `leadScore Int?` (range 0–100, nullable).
- **MVP Rule:** Lead score is a clean, editable, or null field initially.
- **No Implicit Hardcoded Formula:** The BANT +25/+25/+25/+25 heuristic is **not** hardcoded as an immutable permanent business rule in B2.1.
- Deterministic scoring rules and automated recalculations will be specified as explicit business rules in a dedicated phase.
- **Zero AI / ML scoring:** No unpredictable or black-box algorithms are introduced.

---

## 10. Next Action Snapshot Architecture (B2.1 vs B2.3)

- **Lightweight Snapshot in B2.1:**
  - `nextActionDueAt`, `nextActionType`, `nextActionPurpose`, `nextActionOwnerId` live directly on `Lead`.
  - Serves the immediate E1 frontend requirement that every active lead displays a next action (`BR-ACT-01`).
- **Canonical Boundary with B2.3 (Tasks):**
  - In B2.3, the `tasks` table becomes the canonical operational engine for all follow-ups, overdue tracking, and reminders.
  - When Tasks are implemented in B2.3, completing or rescheduling a Task will automatically synchronize with and derive the Lead's lightweight next-action snapshot columns.
  - No Task tables or Task services are created in B2.1.

---

## 11. Proposed REST API Endpoints (`/api/v1/leads`)

All endpoints require Bearer JWT authentication and strict tenant isolation (`organizationId`).

| Method | Endpoint | Required Permission | Description & Output Shape |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/leads` | `leads:read` | List leads. Scoped to `ownerId = currentUser.id` for `BDE_SALES`; org-wide for `ADMIN`/`MANAGER`. Supports pagination, sorting, search, and filters. |
| `POST` | `/api/v1/leads` | `leads:create` | Create a new lead. Enforces deduplication, assigns owner, validates tenant boundaries. |
| `GET` | `/api/v1/leads/:id` | `leads:read` | Retrieve 360° lead record with owner details and BANT qualification data. Enforces visibility. |
| `PATCH`| `/api/v1/leads/:id` | `leads:update` | Update contact info, priority, company, or service interest. |
| `PATCH`| `/api/v1/leads/:id/assign` | `leads:update` | Reassign lead to another active team member (Restricted to `ADMIN` / `MANAGER`). Logs `LEAD_REASSIGNED`. |
| `PATCH`| `/api/v1/leads/:id/status` | `leads:update` | Transition lifecycle status (`CONTACTED`, `QUALIFIED`, `UNQUALIFIED`, etc.). Requires `unqualifiedReason` if setting `UNQUALIFIED`. |
| `GET` | `/api/v1/leads/:id/qualification` | `leads:read` | Fetch BANT qualification criteria. |
| `PUT` | `/api/v1/leads/:id/qualification` | `leads:update` | Upsert BANT qualification criteria. |
| `DELETE`| `/api/v1/leads/:id` | `leads:delete` | Soft-deletes the lead (`deleted_at = now()`). Restricted to `ADMIN`. |

---

## 12. Permissions Proposal

The 4 core lead permissions already exist in the database from the B1 seed script:
1. `leads:read` (Assigned to: `ADMIN`, `MANAGER`, `BDE_SALES`, `MARKETING`, `DELIVERY`)
2. `leads:create` (Assigned to: `ADMIN`, `MANAGER`, `BDE_SALES`, `MARKETING`)
3. `leads:update` (Assigned to: `ADMIN`, `MANAGER`, `BDE_SALES`, `MARKETING`)
4. `leads:delete` (Assigned to: `ADMIN`)

*No new database permissions are required for B2.1.* Reassignment is restricted to `ADMIN` and `MANAGER` roles within `LeadsService`.

---

## 13. Validation Rules & Constraints

1. **`fullName`:** Required, string, min 2 chars, max 150 chars. Trimmed.
2. **`companyName`:** Optional, string, max 150 chars. Trimmed.
3. **`phone`:** Required, string. E.164 normalization regex (`^\+?[1-9]\d{7,14}$`). Automatically normalized (stripping whitespace, hyphens, parentheses).
4. **`email`:** Required, string. RFC 5322 regex. Automatically trimmed and lowercased.
5. **`source`:** Required, must be one of the 7 valid `LeadSource` enum values.
6. **`status`:** Lifecycle enum (`NEW`, `CONTACTED`, `QUALIFIED`, `UNQUALIFIED`, `CONVERTED`, `LOST`).
7. **`priority`:** Priority enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`). Default: `MEDIUM`.
8. **`temperature`:** Optional enum (`HOT`, `WARM`, `COLD`, Nullable).
9. **`unqualifiedReason`:** Required if status is updated to `UNQUALIFIED`. Valid reason codes: `PRICE_TOO_HIGH`, `OUT_OF_SCOPE`, `STUDENT_SPAM`, `COMPETITOR`, `UNRESPONSIVE`, `OTHER`.
10. **`leadScore`:** Optional integer between `0` and `100`.

---

## 14. Audit Requirements

Lead operational actions will automatically write immutable audit events via B1 `AuditService.record()`:
- `LEAD_CREATED`: records creator, initial owner, source, priority.
- `LEAD_UPDATED`: records modified fields.
- `LEAD_REASSIGNED`: records `previousOwnerId`, `newOwnerId`, `changedBy`.
- `LEAD_STATUS_CHANGED`: records `previousStatus`, `newStatus`, `unqualifiedReason`.
- `LEAD_QUALIFIED`: records BANT evaluation scores.
- `LEAD_DELETED`: records deletion timestamp and reason.

---

## 15. Migration Impact

- **Migration Name:** `add_b2_1_lead_management`
- **Tables Added:**
  1. `leads`
  2. `lead_qualifications`
- **Existing Tables Impacted:**
  - `organizations`: Reverse relation for `leads.organization_id`.
  - `users`: Reverse relations for `leads.owner_id`, `leads.next_action_owner_id`, `lead_qualifications.qualified_by_user_id`.
  - Zero existing columns modified or deleted. Zero risk to B1 authentication or session data.

---

## 16. Test Plan

Comprehensive unit and integration test suites in `apps/api/test/leads.spec.ts`:
1. **Creation:** Create valid lead with E.164 phone normalization; verify default status `NEW`, default priority `MEDIUM`, and audit record.
2. **Validation:** Reject invalid phone, invalid email, missing full name, invalid source enum.
3. **Deduplication:** Reject manual creation of lead with existing active phone/email in same tenant (HTTP 409).
4. **Pagination & Querying:** Verify limit, page, and total count metadata.
5. **Filtering:** Verify filtering by `status`, `priority`, `source`, and `ownerId`.
6. **Search:** Verify multi-field search across name, company, phone, email, and service.
7. **BDE Visibility Scoping:** Verify `BDE_SALES` user only sees leads assigned to them. Verify `ADMIN`/`MANAGER` sees all tenant leads.
8. **Ownership & Assignment:** Reassign lead; verify tenant validation prevents assigning to user in another org; verify `LEAD_REASSIGNED` audit log.
9. **Status Transitions:** Transition lead through lifecycle. Attempt `UNQUALIFIED` without reason (must fail with 400).
10. **Qualification:** Upsert BANT qualification; verify 1:1 relation.
11. **Multi-Tenant Isolation:** Verify User in Org 1 cannot view or modify Lead in Org 2 (returns 404).
12. **Soft Deletion:** Soft delete lead; verify excluded from listings.

---

## 17. Recommended Implementation Sequence

Once this plan is approved:

1. **Step 1:** Update `apps/api/prisma/schema.prisma` with `Lead` and `LeadQualification`.
2. **Step 2:** Execute Prisma migration: `npx prisma migrate dev --name add_b2_1_lead_management`.
3. **Step 3:** Implement DTOs (`create-lead.dto.ts`, `update-lead.dto.ts`, `lead-query.dto.ts`, `lead-response.dto.ts`, `qualification.dto.ts`).
4. **Step 4:** Implement `LeadsService` with multi-tenant repository queries and BDE scoping.
5. **Step 5:** Implement `LeadsController` under `/api/v1/leads` with RBAC guards.
6. **Step 6:** Wire `LeadsModule` into `AppModule`.
7. **Step 7:** Write and execute automated test suites (`apps/api/test/leads.spec.ts`).
8. **Step 8:** Execute `npm run backend:typecheck`, `npm run backend:build`, `npm run backend:test`.
9. **Step 9:** Technical verification report and STOP.

---

## 18. Approval Decisions Required

Before implementation begins, please confirm approval on the following design choices:

1. **Separation of Status and Priority Confirmation:**
   - Lifecycle Status: `NEW`, `CONTACTED`, `QUALIFIED`, `UNQUALIFIED`, `CONVERTED`, `LOST`.
   - Priority: `LOW`, `MEDIUM`, `HIGH`, `URGENT` (Default: `MEDIUM`).
   - Temperature: Optional nullable field (`HOT`, `WARM`, `COLD`) to satisfy existing E1 display contracts without compromising lifecycle modeling.
   - *Confirmation requested: Approved.*
2. **Default BDE Scoped Visibility:**
   - `BDE_SALES` sees only leads where `ownerId = currentUser.userId`.
   - `ADMIN` & `MANAGER` see all leads across their organization.
   - *Confirmation requested: Approved.*
3. **Manual Deduplication Enforcement:**
   - Manual lead creation rejects duplicates (`phone` or `email` match within the same organization) with HTTP 409 Conflict.
   - *Confirmation requested: Approved.*
4. **Next-Action Snapshot:**
   - Next-action fields live as lightweight snapshot columns on `Lead` in B2.1, with Task synchronization deferred to B2.3.
   - *Confirmation requested: Approved.*
