# Settings Module Frontend ↔ Backend Gap Audit

**Date:** 2026-10-07  
**Module:** Settings (`src/pages/settings/SettingsPage.tsx`)  
**Audit Type:** Read-Only Technical Inspection  
**Status:** Completed  

---

## 1. Executive Summary

This read-only audit provides a comprehensive technical assessment of the **Settings module** within DigiTechzo CRM.

### Key Audit Findings:
1. **Frontend State:** The current Settings page (`src/pages/settings/SettingsPage.tsx`) consists of four tabs: **General**, **Pipeline**, **Taxonomies**, and **Adapters**.
2. **100% Mock / Hardcoded Data:** All data rendered in `SettingsPage.tsx` is static, hardcoded constants, or imported from legacy mock data (`MOCK_PIPELINE_STAGES`, `MOCK_DEALS`). There are zero live API calls or TanStack Query hooks.
3. **No True Persistence:** The "Save Changes" button merely sets a 4-second local React state notification (`sessionSaveNotice`) without sending any network requests.
4. **Backend Reference APIs Already Exist:** The backend already has verified endpoints for `GET /api/v1/deals/stages` and `GET /api/v1/deals/lost-reasons`, which can immediately supply live data for the Pipeline and Taxonomies tabs.
5. **No Migration Required:** The existing PostgreSQL schema (`organizations`, `pipeline_stages`, `lost_reasons`, `users`, `roles`, `permissions`) is sufficient for the present read-only/administrative configuration view. No database schema alterations or migrations are required.

---

## 2. Current Settings Frontend Sections

The current UI in `src/pages/settings/SettingsPage.tsx` contains the following sections:

### 2.1 Page Header
- Title: `Settings`
- Badge: `Admin Config`
- Save Button: `Save Changes` (triggers a dummy local state toast: "Changes saved for this session")

### 2.2 Tab 1: General (`activeTab === 'general'`)
- **Card A: Organization Parameters**
  - Organization Name: `DigiTechzo` (hardcoded)
  - Base Currency: `INR (₹)` (hardcoded)
  - System Timezone: `Asia/Kolkata (IST, UTC+5:30)` (hardcoded)
  - Tenant Mode: `Single-Tenant Dedicated` (hardcoded badge)
- **Card B: Application Runtime State**
  - Execution Mode: `Phase 2 Mock Workflows` (hardcoded badge)
  - State Persistence: `In-Memory / React Session` (hardcoded text)
  - Design System: `DigiTechzo Tokenized (Manrope)` (hardcoded text)
  - Active Role Scopes: `Super Admin, Manager, BDE` (hardcoded text)

### 2.3 Tab 2: Pipeline (`activeTab === 'pipeline'`)
- **Section: Pipeline Stages & Forecast Probabilities**
  - Displays a table with columns: Sequence (`#order`), Stage Name, Stage Type (`OPEN` / `WON` / `LOST`), Win Probability (`%`), and Active Deals count.
  - Data is sourced from `MOCK_PIPELINE_STAGES` and `MOCK_DEALS`.
  - Probabilities are looked up from a hardcoded map `STAGE_PROBABILITIES`.

### 2.4 Tab 3: Taxonomies (`activeTab === 'taxonomies'`)
- **Column A: Standardized Lost Reasons (Rule BR-PIPE-02)**
  - Card listing 6 hardcoded lost reasons (`PRICE_TOO_HIGH`, `COMPETITOR_CHOSEN`, `UNRESPONSIVE_GHOSTED`, `SCOPE_MISMATCH`, `TIMING_POSTPONED`, `OTHER`) with codes and categories.
- **Column B1: Lead Capture Sources**
  - Card listing 7 hardcoded sources (`META_ADS`, `GOOGLE_ADS`, `WEBSITE_FORM`, `WHATSAPP`, `MANUAL`, `IMPORT`, `PHONE_INBOUND`) with channel types.
- **Column B2: Active Service Offerings**
  - Card listing 5 hardcoded service offerings (Custom Web App, Digital Marketing, Mobile App, SEO, Cloud Infrastructure).

### 2.5 Tab 4: Adapters (`activeTab === 'adapters'`)
- **Section: Integration Adapters Architecture Status**
  - Lists 4 integration adapters:
    1. `WhatsApp MessagingAdapter` (`Planned (Phase 7) / Not Connected`)
    2. `TelephonyAdapter (Cloud Voice)` (`Planned (Phase 8) / Not Connected`)
    3. `StorageAdapter (Document Storage)` (`Phase 2 Mock Mode`)
    4. `Database & Persistence Layer` (`Mock Data Mode / PostgreSQL Planned`)

### 2.6 Sections NOT Present in Current UI
- No User Profile / Personal Account settings section (no name/email/phone editing, no password change form, no avatar upload).
- No Security / 2FA / Session management section.
- No Notification preferences section.
- No Theme / Dark mode / Appearance toggle section.
- No Custom Fields or Lead SLA configuration.
- No Pipeline Stage creation/reordering/editing tools (purely read-only display).

---

## 3. Frontend Data Source Audit

| Component / Section | Data Source | Symbol / File | Nature |
|---------------------|-------------|---------------|--------|
| Category Tabs | Hardcoded Constant | `SETTINGS_TABS` in `SettingsPage.tsx` | Static Array |
| General Org Card | Hardcoded Strings | Inline JSX in `SettingsPage.tsx` | Static Text |
| General Runtime Card | Hardcoded Strings | Inline JSX in `SettingsPage.tsx` | Static Text |
| Pipeline Stages Table | Mock Data Import | `MOCK_PIPELINE_STAGES` from `src/mocks/mockData.ts` | Static Mock Array |
| Pipeline Deal Counts | Mock Deals Import | `MOCK_DEALS` from `src/mocks/mockData.ts` | Static Mock Array |
| Stage Probabilities | Hardcoded Object | `STAGE_PROBABILITIES` in `SettingsPage.tsx` | Static Map |
| Lost Reasons List | Hardcoded Constant | `LOST_REASONS` in `SettingsPage.tsx` | Static Array |
| Lead Sources List | Hardcoded Constant | `LEAD_SOURCES` in `SettingsPage.tsx` | Static Array |
| Service Lines List | Hardcoded Constant | `SERVICE_LINES` in `SettingsPage.tsx` | Static Array |
| Adapter Statuses | Hardcoded Constant | `ADAPTER_STATUSES` in `SettingsPage.tsx` | Static Array |
| Save Feedback Notice | React `useState` | `sessionSaveNotice` in `SettingsPage.tsx` | In-Memory Local State |

---

## 4. API Client Audit (`src/lib/api.ts`)

| API Method | HTTP Route | Purpose | Verified in Backend | Used by SettingsPage |
|------------|------------|---------|---------------------|----------------------|
| `authApi.getMe()` | `GET /auth/me` | Fetch authenticated user & org info | Yes (200 OK) | **No** |
| `crmApi.getPipelineStages()` | `GET /deals/stages` | Fetch system pipeline stages | Yes (200 OK) | **No** |
| `crmApi.getLostReasons()` | `GET /deals/lost-reasons` | Fetch active lost reasons | Yes (200 OK) | **No** |
| `crmApi.getRoles()` | `GET /roles` | Fetch system roles | Yes (200 OK) | **No** |
| `crmApi.getUsers()` | `GET /users` | Fetch team directory | Yes (200 OK) | **No** |
| `crmApi.getDeals()` | `GET /deals` | Fetch pipeline deals | Yes (200 OK) | **No** |
| `crmApi.getSettings()` | N/A | Fetch system/org settings | **Does not exist** | **No** |

---

## 5. Existing Backend Endpoints

| HTTP Method | Route | Controller | Service | Permission Required | Tenant Scope |
|-------------|-------|------------|---------|---------------------|--------------|
| `GET` | `/api/v1/auth/me` | `AuthController` | `AuthService.getMe` | Authenticated | Organization-scoped |
| `GET` | `/api/v1/users/me` | `UsersController` | `UsersService.getProfile` | Authenticated | Organization-scoped |
| `GET` | `/api/v1/deals/stages` | `DealsController` | `DealsService.getStages` | `deals:read` | System-wide (Reference) |
| `GET` | `/api/v1/deals/lost-reasons` | `DealsController` | `DealsService.getLostReasons` | `deals:read` | System-wide (Reference) |
| `GET` | `/api/v1/roles` | `RolesController` | `RolesService.findAll` | `roles:read` | System-wide (Reference) |
| `GET` | `/api/v1/health` | `HealthController` | `HealthService.check` | Public / Authenticated | Global |
| `GET` | `/api/v1/users` | `UsersController` | `UsersService.findAll` | `users:read` | Organization-scoped |

---

## 6. Database / Prisma Audit

| Model | Table Name | Fields Available | Organization Scoped | Status / Support |
|-------|------------|------------------|---------------------|------------------|
| `Organization` | `organizations` | `id`, `name`, `slug`, `status`, `createdAt`, `updatedAt` | Self (Root Tenant) | Seeded (`DigiTechzo Media & Technologies Pvt Ltd`) |
| `PipelineStage` | `pipeline_stages` | `id`, `name`, `order`, `stageType`, `dealCountBenchmark`, `totalValueBenchmark`, `createdAt`, `updatedAt` | Global / System Reference | 6 Stages seeded & active |
| `LostReason` | `lost_reasons` | `id`, `code`, `label`, `isActive`, `createdAt`, `updatedAt` | Global / System Reference | 5 Reasons seeded & active |
| `User` | `users` | `id`, `organizationId`, `roleId`, `name`, `email`, `phone`, `passwordHash`, `status`, `createdAt`, `updatedAt` | Yes (`organizationId`) | Full CRUD in place |
| `Role` | `roles` | `id`, `name`, `description`, `isSystem`, `createdAt`, `updatedAt` | Global / System Reference | 5 Roles seeded |
| `Permission` | `permissions` | `id`, `resource`, `action`, `description`, `createdAt` | Global / System Reference | 38 Permissions seeded |
| `RolePermission`| `role_permissions`| `id`, `roleId`, `permissionId` | Global / System Reference | 86 Mappings seeded |
| `AuditLog` | `audit_logs` | `id`, `organizationId`, `userId`, `action`, `resource`, `resourceId`, `details`, `ipAddress`, `userAgent`, `requestId`, `createdAt` | Yes (`organizationId`) | Automated event logging active |

---

## 7. Pipeline Settings Audit

- **Database Support:** The `PipelineStage` table contains 6 configured stages:
  1. `Qualification` (Order 1, `OPEN`, Benchmark: 8 deals, ₹24,00,000)
  2. `Discovery` (Order 2, `OPEN`, Benchmark: 5 deals, ₹17,50,000)
  3. `Proposal Sent` (Order 3, `OPEN`, Benchmark: 4 deals, ₹16,00,000)
  4. `Negotiation` (Order 4, `OPEN`, Benchmark: 3 deals, ₹12,00,000)
  5. `Closed Won` (Order 5, `WON`, Benchmark: 2 deals, ₹9,50,000)
  6. `Closed Lost` (Order 6, `LOST`, Benchmark: 6 deals, ₹18,50,000)
- **Backend Read Endpoint:** `GET /api/v1/deals/stages` exists and works.
- **Backend Write Endpoints:** None exist (no `POST /stages`, `PATCH /stages/:id`, `DELETE /stages/:id`).
- **Frontend Settings Capabilities:**
  - View stages: Currently displays mock data; can be wired directly to `GET /api/v1/deals/stages`.
  - Create / Edit / Delete / Reorder stages: Not present in UI.

---

## 8. Lost Reasons Settings Audit

- **Database Support:** The `LostReason` table contains 5 configured reasons:
  1. `PRICE_TOO_HIGH` ("Price too high / Budget constraint")
  2. `COMPETITOR_CHOSEN` ("Selected alternative competitor")
  3. `TIMING_POSTPONED` ("Project postponed or deprioritized")
  4. `POOR_FIT` ("Requirements outside current technical capabilities")
  5. `UNRESPONSIVE` ("Prospect stopped responding after follow-ups")
- **Backend Read Endpoint:** `GET /api/v1/deals/lost-reasons` exists and works.
- **Backend Write Endpoints:** None exist.
- **Frontend Settings Capabilities:**
  - View lost reasons: Currently displays hardcoded array (`LOST_REASONS`); can be wired to `GET /api/v1/deals/lost-reasons`.
  - Create / Edit / Deactivate reasons: Not present in UI.

---

## 9. Profile / Account Settings Audit

| Operation | Status | Technical Details |
|-----------|--------|-------------------|
| View Profile | **SUPPORTED** | `GET /api/v1/auth/me` and `GET /api/v1/users/me` return full profile. |
| Update Name | **BACKEND SUPPORTED / FRONTEND NOT PRESENT** | `PATCH /api/v1/users/:id` exists, but no UI form in `SettingsPage.tsx`. |
| Update Email | **BACKEND SUPPORTED / FRONTEND NOT PRESENT** | `PATCH /api/v1/users/:id` exists, but no UI form in `SettingsPage.tsx`. |
| Update Phone | **BACKEND SUPPORTED / FRONTEND NOT PRESENT** | `PATCH /api/v1/users/:id` exists, but no UI form in `SettingsPage.tsx`. |
| Change Password | **BACKEND MISSING DEDICATED ENDPOINT / FRONTEND NOT PRESENT** | No self-service `POST /auth/change-password`; no UI in `SettingsPage.tsx`. |
| Update Preferences | **NOT PRESENT** | No database columns or API endpoints. |
| Update Notifications | **NOT PRESENT** | No database columns or API endpoints. |
| Profile Photo / Avatar | **NOT PRESENT** | No storage adapter or avatar upload endpoint. |

---

## 10. Organization Settings Audit

- **Organization Entity:** Exists in database with `name` ("DigiTechzo Media & Technologies Pvt Ltd") and `slug` ("digitechzo").
- **Extended Fields:** `currency`, `timezone`, `address`, `phone`, `logoUrl` are **not** present in `Organization` schema.
- **APIs:** No Organization controller or endpoints exist (`GET /api/v1/organizations/me`, `PATCH /api/v1/organizations/me`).
- **Tenant Safety:** Currently single-tenant organization model linked via `organizationId`.

---

## 11. Security Settings Audit

- **Argon2id Hashing:** Verified for all user passwords.
- **Refresh Token Rotation & Theft Detection:** Verified via `POST /api/v1/auth/refresh`.
- **Session Termination / Logout:** Verified via `POST /api/v1/auth/logout`.
- **Audit Logging:** Verified via `AuditService` recording security and CRUD events.
- **2FA / MFA:** Not implemented in backend or frontend.

---

## 12. Notification Settings Audit

- **Status:** **NOT PRESENT**.
- There is no database table, DTO, controller, service, or frontend UI for email, WhatsApp, or in-app notification preferences.

---

## 13. Appearance / Preferences Audit

- **Status:** **NOT PRESENT**.
- The CRM uses a unified, static tokenized design system (Tailwind + CSS custom variables).
- No theme switcher (dark mode/light mode) or density toggles exist.

---

## 14. RBAC & Permissions Audit

- **Seed Permissions:**
  - `settings:read`: Assigned to `ADMIN` and `MANAGER`.
  - `settings:update`: Assigned to `ADMIN`.
- **Enforcement:** `PermissionsGuard` and `@Permissions('settings:read')` decorator are fully operational.
- **Compliance:** Full compliance with `docs/AUTH-RBAC.md`. No ADMIN bypass exists.

---

## 15. Tenant Isolation Audit

- `User`, `Lead`, `Deal`, `Task`, `Activity`, `Meeting`, `Proposal`, `Customer`, and `AuditLog` strictly enforce `organizationId` derived from the verified JWT.
- `PipelineStage`, `LostReason`, `Role`, and `Permission` are system-wide reference catalog entities.
- Cross-tenant data leaks are structurally prevented.

---

## 16. Migration Requirement Analysis

- **Decision:** **NO DATABASE MIGRATION REQUIRED (Option A)**.
- **Rationale:**
  1. The existing database tables (`organizations`, `pipeline_stages`, `lost_reasons`, `users`, `audit_logs`) already possess the data required to back the current Settings UI.
  2. The current UI does not require custom organization fields, dynamic taxonomies, or notification settings tables.
  3. Read-only integration can be completed immediately using existing endpoints (`GET /deals/stages`, `GET /deals/lost-reasons`, `GET /auth/me`, `GET /health`).

---

## 17. Settings Implementation Matrix

| Settings Section | Frontend Exists | Mock / Static | Backend Exists | API Exists | DB Support | RBAC Exists | Migration Needed | Recommended Action |
|------------------|-----------------|---------------|----------------|------------|------------|-------------|------------------|--------------------|
| **Organization Parameters** | Yes | Yes (Hardcoded) | Partial | `GET /auth/me` | `Organization` table | Yes (`settings:read`) | No | Bind to `authApi.getMe()` / real Org name & status |
| **Application Runtime State** | Yes | Yes (Hardcoded) | Yes | `GET /health` | Health probe | Yes | No | Bind runtime mode & DB connectivity to live status |
| **Pipeline Stages** | Yes | Yes (`MOCK_*`) | Yes | `GET /deals/stages` | `PipelineStage` table | Yes (`deals:read`) | No | Replace mock data with `crmApi.getPipelineStages()` |
| **Lost Reasons** | Yes | Yes (Hardcoded) | Yes | `GET /deals/lost-reasons` | `LostReason` table | Yes (`deals:read`) | No | Replace hardcoded array with `crmApi.getLostReasons()` |
| **Lead Sources** | Yes | Yes (Hardcoded) | Yes (Enum) | Via Lead DTOs | Stored in `leads.source` | Yes | No | Keep standardized taxonomy display aligned with schema enum |
| **Service Lines** | Yes | Yes (Hardcoded) | Implicit | Stored in `serviceInterest` | Free text / String | Yes | No | Keep standardized offerings list aligned with Lead form |
| **Adapters Status** | Yes | Yes (Hardcoded) | Partial | `GET /health` | Health probe | Yes | No | Update adapter cards to reflect true live status (PostgreSQL: Active, etc.) |

---

## 18. Priority Classification

- **P0 (Essential Core Integration):**
  1. Connect Pipeline Stages tab to live `GET /api/v1/deals/stages`.
  2. Connect Lost Reasons tab to live `GET /api/v1/deals/lost-reasons`.
  3. Bind Organization Parameters card to live authenticated organization data (`authApi.getMe()`).
  4. Update Application Runtime and Database status to reflect live PostgreSQL connection.
  5. Remove legacy mock data imports (`MOCK_PIPELINE_STAGES`, `MOCK_DEALS`).
- **P1 (Useful Enhancements):**
  1. Add live deal counts per stage in Pipeline settings table using deals aggregation or query.
  2. Add visual indication for database health and API connectivity.
- **P2 (Future / Phase 4+):**
  1. Dynamic Pipeline Stage CRUD (create, reorder, delete custom stages).
  2. Dynamic Lost Reason CRUD.
  3. Self-service User Profile & Password Change tab.
  4. Custom Lead Fields & SLA Configuration.

---

## 19. Out-of-Scope Items

The following are strictly out of scope and should **NOT** be implemented:
- WhatsApp Business Cloud API configuration
- Cloud Telephony / VoIP SIP settings
- Audio call recording storage settings
- AI / LLM summary configuration
- External Zapier / Webhook integration settings
- Custom theme / dark mode builder
- Multi-currency rate conversion engine

---

## 20. Exact Files Required for Future Implementation

When implementation is approved, only the following files will be touched:

### Frontend:
- `src/pages/settings/SettingsPage.tsx`: Replace mock imports and hardcoded values with TanStack Query hooks consuming `crmApi.getPipelineStages()`, `crmApi.getLostReasons()`, and `authApi.getMe()`.

### Backend:
- **No backend changes required** for the existing read-only settings views, as all required endpoints (`/api/v1/deals/stages`, `/api/v1/deals/lost-reasons`, `/api/v1/auth/me`, `/api/v1/health`) already exist and are verified.

---

## 21. Verification of System State

- **MariaDB :3306:** Untouched and active on PID 5436.
- **PostgreSQL Database:** Untouched; no data modified.
- **Prisma Schema & Migrations:** Untouched; no migrations created.
- **Source Code:** Untouched; zero application code changes made.
