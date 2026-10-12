# DigiTechzo CRM — Pipeline Reference Data API Report

**Date:** 2026-10-07  
**Scope:** Backend-only reference-data endpoints for Pipeline Stages and Lost Reasons  
**Target Environment:** Localhost (NestJS API on port 4000, PostgreSQL on port 5432)  
**Database Name:** `digitechzo_crm` (PostgreSQL `public` schema)  

---

## 1. Files Changed

Only the existing Deals backend module files and its unit test suite were modified:

1. [`apps/api/src/modules/deals/dto/deal-response.dto.ts`](file:///C:/DigiTechzo%20CRM/apps/api/src/modules/deals/dto/deal-response.dto.ts):
   - Added `PipelineStageResponseDto` class with Swagger annotations (`id`, `name`, `order`, `stageType`, `dealCountBenchmark`, `totalValueBenchmark`).
   - Added `LostReasonResponseDto` class with Swagger annotations (`id`, `code`, `label`, `isActive`).
2. [`apps/api/src/modules/deals/deals.service.ts`](file:///C:/DigiTechzo%20CRM/apps/api/src/modules/deals/deals.service.ts):
   - Added `getStages()`: queries `prisma.pipelineStage.findMany({ orderBy: { order: 'asc' } })` and maps benchmarks to response DTO.
   - Added `getLostReasons()`: queries `prisma.lostReason.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } })`.
3. [`apps/api/src/modules/deals/deals.controller.ts`](file:///C:/DigiTechzo%20CRM/apps/api/src/modules/deals/deals.controller.ts):
   - Registered `GET /api/v1/deals/stages` protected by `@Permissions('deals:read')`.
   - Registered `GET /api/v1/deals/lost-reasons` protected by `@Permissions('deals:read')`.
   - Placed routes before `@Get(':id')` to ensure proper routing precedence.
4. [`apps/api/test/deals.spec.ts`](file:///C:/DigiTechzo%20CRM/apps/api/test/deals.spec.ts):
   - Added mocks for `pipelineStage.findMany` and `lostReason.findMany`.
   - Added automated unit test specs verifying stage sorting and active reason filtering.

---

## 2. Endpoints Added

| Method | Route | Permission Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/deals/stages` | `deals:read` | Returns active pipeline stages sorted by sequential display order (`order ASC`). |
| `GET` | `/api/v1/deals/lost-reasons` | `deals:read` | Returns active lost reason reference codes and descriptions. |

---

## 3. Response Structure

### A. `GET /api/v1/deals/stages`
```json
{
  "success": true,
  "data": [
    {
      "id": "bc0de882-5e84-487c-aa52-338bc7ab0922",
      "name": "Qualification",
      "order": 1,
      "stageType": "OPEN",
      "dealCountBenchmark": 8,
      "totalValueBenchmark": 2400000
    },
    {
      "id": "a5a514e7-3bed-49c8-ab9f-88322c859912",
      "name": "Discovery",
      "order": 2,
      "stageType": "OPEN",
      "dealCountBenchmark": 5,
      "totalValueBenchmark": 1750000
    },
    {
      "id": "efc8754a-073e-48bd-afea-4087eb875bbe",
      "name": "Proposal Sent",
      "order": 3,
      "stageType": "OPEN",
      "dealCountBenchmark": 4,
      "totalValueBenchmark": 1600000
    },
    {
      "id": "fd597ead-1b01-4324-8bdf-840e6573a133",
      "name": "Negotiation",
      "order": 4,
      "stageType": "OPEN",
      "dealCountBenchmark": 3,
      "totalValueBenchmark": 1200000
    },
    {
      "id": "04f44f5d-fc2b-4c5f-8d62-b4f107a4fbb4",
      "name": "Closed Won",
      "order": 5,
      "stageType": "WON",
      "dealCountBenchmark": 2,
      "totalValueBenchmark": 950000
    },
    {
      "id": "1f766547-9e2e-4986-b87f-55e5b7c0d72b",
      "name": "Closed Lost",
      "order": 6,
      "stageType": "LOST",
      "dealCountBenchmark": 6,
      "totalValueBenchmark": 1850000
    }
  ]
}
```

### B. `GET /api/v1/deals/lost-reasons`
```json
{
  "success": true,
  "data": [
    {
      "id": "f2575cad-a523-437b-809e-0b2cacea8449",
      "code": "COMPETITOR_CHOSEN",
      "label": "Selected alternative competitor",
      "isActive": true
    },
    {
      "id": "170bb33a-91f7-457e-a79d-6e808bd5f2de",
      "code": "POOR_FIT",
      "label": "Requirements outside current technical capabilities",
      "isActive": true
    },
    {
      "id": "6a66c1de-1ed4-4f53-9fae-18deab47f7bf",
      "code": "PRICE_TOO_HIGH",
      "label": "Price too high / Budget constraint",
      "isActive": true
    },
    {
      "id": "db16c99e-0101-4b48-b5d5-2fdbe153c2c8",
      "code": "TIMING_POSTPONED",
      "label": "Project postponed or deprioritized",
      "isActive": true
    },
    {
      "id": "a1fc3047-78e3-45b3-9c81-8c36b4200df9",
      "code": "UNRESPONSIVE",
      "label": "Prospect stopped responding after follow-ups",
      "isActive": true
    }
  ]
}
```

---

## 4. Database Counts (Read-Only Verification)

Direct query against PostgreSQL `digitechzo_crm`:

| Table | Count | Verification |
| :--- | :---: | :--- |
| `pipeline_stages` | **6** | Seeded reference stages intact |
| `lost_reasons` | **5** | Seeded reference reasons intact |
| `leads` | **1** | Existing lead (`Kaniga`) preserved |
| `deals` | **0** | Table empty (ready for real deal creation) |
| `users` | **1** | Admin account preserved |
| `organizations` | **1** | Organization preserved |

---

## 5. Stage Ordering Verification

Stages returned in strict chronological progression:
1. `order = 1`: **Qualification** (`stageType = OPEN`)
2. `order = 2`: **Discovery** (`stageType = OPEN`)
3. `order = 3`: **Proposal Sent** (`stageType = OPEN`)
4. `order = 4`: **Negotiation** (`stageType = OPEN`)
5. `order = 5`: **Closed Won** (`stageType = WON`)
6. `order = 6`: **Closed Lost** (`stageType = LOST`)

All returned `id` values are confirmed valid UUIDv4 strings directly from PostgreSQL.

---

## 6. Lost Reason Verification

- Total reasons returned: **5**
- Filtered to `isActive = true` records only.
- Codes returned: `COMPETITOR_CHOSEN`, `POOR_FIT`, `PRICE_TOO_HIGH`, `TIMING_POSTPONED`, `UNRESPONSIVE`.
- All `id` values are valid PostgreSQL UUIDv4 strings.

---

## 7. Authorization Verification

1. **Unauthenticated Request:**
   - `GET /api/v1/deals/stages` without token $\rightarrow$ **HTTP 401 Unauthorized**
   - `GET /api/v1/deals/lost-reasons` without token $\rightarrow$ **HTTP 401 Unauthorized**
2. **Authenticated Request (`admin@digitechzo.com`):**
   - Uses Bearer JWT containing real `deals:read` permission.
   - `GET /api/v1/deals/stages` $\rightarrow$ **HTTP 200 OK**
   - `GET /api/v1/deals/lost-reasons` $\rightarrow$ **HTTP 200 OK**
   - Verified that `PermissionsGuard` enforces access without any admin bypass.

---

## 8. Backend Test Suite

Executed the full backend automated test suite (`npm test` in `apps/api`):

```text
PASS test/meetings.spec.ts
PASS test/customers.spec.ts
PASS test/deals.spec.ts
PASS test/leads.spec.ts
PASS test/activities.spec.ts
PASS test/auth.spec.ts
PASS test/proposals.spec.ts
PASS test/tasks.spec.ts
PASS test/rbac.spec.ts
PASS test/security.spec.ts
PASS test/health.spec.ts

Test Suites: 11 passed, 11 total
Tests:       92 passed, 92 total
Snapshots:   0 total
Time:        18.459 s
```
- Includes 2 new unit tests in `test/deals.spec.ts` testing `getStages()` and `getLostReasons()`.
- **Result:** **100% Pass** (11/11 test suites, 92/92 tests).

---

## 9. Typecheck & Build Verification

1. **Backend TypeScript Typecheck:**
   ```bash
   npm run typecheck
   ```
   - **Result:** Exited with code 0 (zero errors).
2. **Backend NestJS Build:**
   ```bash
   npm run build
   ```
   - **Result:** Exited with code 0 (clean compilation into `dist/`).

---

## 10. MariaDB Verification

- **Port:** `3306`
- **Process ID:** `5436`
- **Status:** `LISTENING`
- **Verification:** Completely untouched throughout all changes.

---

## Scope Compliance

- Zero frontend files modified.
- No frontend Pipeline integration performed yet.
- Zero database modifications or migrations made.
- Stopped after completing reference-data API task as instructed.
