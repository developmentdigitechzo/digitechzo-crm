# DigiTechzo CRM — RBAC Seed Data Fix Report

**Date:** 2026-10-07  
**Scope:** Execute existing Prisma seed script to populate missing RBAC/taxonomy database data without code modification  
**Target Environment:** Localhost (NestJS API on port 4000, PostgreSQL on port 5432)  
**Database Name:** `digitechzo_crm` (PostgreSQL `public` schema)  

---

## 1. Before Counts

Prior to executing the fix, the PostgreSQL database tables contained:

| Table / Entity | Pre-Fix Count | Notes |
| :--- | :---: | :--- |
| `organizations` | **1** | `DigiTechzo Media & Technologies Pvt Ltd` |
| `users` | **1** | `admin@digitechzo.com` (`ADMIN` role) |
| `roles` | **5** | `ADMIN`, `MANAGER`, `BDE_SALES`, `MARKETING`, `DELIVERY` |
| `permissions` | **0** | Missing taxonomy data |
| `role_permissions` | **0** | Missing role mappings |
| `pipeline_stages` | **0** | Missing reference stages |
| `lost_reasons` | **0** | Missing reference reasons |
| `leads` | **1** | Existing lead (`Kaniga`) |

---

## 2. Seed Command Used

Executed the existing idempotent seed script in `apps/api`:

```bash
npm run prisma:seed
```

This runs `ts-node prisma/seed.ts` defined in `apps/api/package.json`.  
Additionally, `npm run prisma:generate` (`prisma generate`) was run to ensure the generated Prisma Client runtime types were in sync with the current schema.

No modifications were made to `seed.ts`—it executed completely as authored with its native idempotent upserts.

Seed execution log output:
```text
> @digitechzo/api@1.0.0 prisma:seed
> ts-node prisma/seed.ts

--- Starting DigiTechzo CRM B1 Database Seed ---
[Seed] Organization configured: DigiTechzo Media & Technologies Pvt Ltd (3a217382-421b-47ae-a7c3-0c65c9f06cb9)
[Seed] 5 system roles ensured.
[Seed] 38 permissions registered.
[Seed] Role-permission matrices mapped.
[Seed] 6 pipeline reference stages seeded.
[Seed] 5 reference lost reasons configured.
[Seed] Admin user seeded: admin@digitechzo.com (4f1bd4a8-2e6a-42f5-847f-f7232293885b)
--- DigiTechzo CRM B1 Database Seed Completed Successfully ---
```

---

## 3. After Counts

Immediately following seed completion, read-only queries confirmed the updated database state:

| Table / Entity | Pre-Fix Count | Post-Fix Count | Change |
| :--- | :---: | :---: | :--- |
| `organizations` | 1 | **1** | Preserved (idempotent upsert) |
| `users` | 1 | **1** | Preserved (`admin@digitechzo.com`) |
| `roles` | 5 | **5** | Preserved (5 system roles) |
| `permissions` | 0 | **38** | **+38 permissions registered** |
| `role_permissions` | 0 | **86** | **+86 role-permission mappings** |
| `pipeline_stages` | 0 | **6** | **+6 pipeline reference stages** |
| `lost_reasons` | 0 | **5** | **+5 lost reference reasons** |
| `leads` | 1 | **1** | **Preserved intact (zero deletions)** |

---

## 4. Admin Permission Count

Authenticated using admin credentials (`admin@digitechzo.com` / `AdminSecurePassword123!`):

- **Login Status:** `200 OK`
- **Total Permissions Received in JWT / Session:** **38 permissions**
- **Permissions List:**
  1. `users:read`
  2. `users:create`
  3. `users:update`
  4. `users:delete`
  5. `roles:read`
  6. `roles:update`
  7. `audit_logs:read`
  8. `settings:read`
  9. `settings:update`
  10. `leads:read`
  11. `leads:create`
  12. `leads:update`
  13. `leads:delete`
  14. `deals:read`
  15. `deals:create`
  16. `deals:update`
  17. `deals:delete`
  18. `tasks:read`
  19. `tasks:create`
  20. `tasks:update`
  21. `tasks:delete`
  22. `activities:read`
  23. `activities:create`
  24. `activities:update`
  25. `activities:delete`
  26. `meetings:read`
  27. `meetings:create`
  28: `meetings:update`
  29. `meetings:delete`
  30. `proposals:read`
  31. `proposals:create`
  32. `proposals:update`
  33. `proposals:delete`
  34. `customers:read`
  35. `customers:create`
  36. `customers:update`
  37. `customers:delete`
  38. `reports:read`

---

## 5. Live Authorization Results

### Test A: `GET /api/v1/users/me`
- **HTTP Status:** `200 OK`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "4f1bd4a8-2e6a-42f5-847f-f7232293885b",
      "name": "DigiTechzo Administrator",
      "email": "admin@digitechzo.com",
      "phone": null,
      "status": "ACTIVE",
      "organization": {
        "id": "3a217382-421b-47ae-a7c3-0c65c9f06cb9",
        "name": "DigiTechzo Media & Technologies Pvt Ltd",
        "slug": "digitechzo",
        "status": "ACTIVE"
      },
      "role": {
        "id": "e13587b0-fcd1-4747-8a51-8f98b7889e3f",
        "name": "ADMIN",
        "description": "Full system administration and control"
      },
      "permissions": [ /* 38 permissions */ ],
      "createdAt": "2026-10-07T05:58:12.984Z"
    }
  }
  ```

### Test B: `GET /api/v1/leads`
- **Previous Status:** `403 Forbidden` (`Missing required permission(s) [leads:read]`)
- **Current Status:** **`200 OK`**
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "f3b67fd8-184f-44fc-b7d5-1fbc60916d1c",
          "organizationId": "3a217382-421b-47ae-a7c3-0c65c9f06cb9",
          "fullName": "Kaniga",
          "companyName": "Boutique",
          "title": null,
          "phone": "+918122289508",
          "email": null,
          "source": "WEBSITE_FORM",
          "status": "NEW",
          "priority": "HIGH",
          "temperature": null,
          "leadScore": null,
          "serviceInterest": "Custom Web Application Development",
          "ownerId": "4f1bd4a8-2e6a-42f5-847f-f7232293885b",
          "ownerName": "DigiTechzo Administrator",
          "unqualifiedReason": null,
          "unqualifiedNotes": null,
          "lastActivityAt": "2026-10-07T10:37:43.234Z",
          "createdAt": "2026-10-07T10:37:43.234Z",
          "updatedAt": "2026-10-07T10:37:43.234Z",
          "nextAction": null,
          "qualification": null
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
  ```
- **Conclusion:** `GET /api/v1/leads` no longer returns 403 Forbidden. Full authorization via `PermissionsGuard` succeeds.

---

## 6. Existing Lead Preservation Verification

- **Lead ID:** `f3b67fd8-184f-44fc-b7d5-1fbc60916d1c`
- **Full Name:** `Kaniga`
- **Phone:** `+918122289508`
- **Company:** `Boutique`
- **Status:** `NEW`
- **Priority:** `HIGH`
- **Organization ID:** `3a217382-421b-47ae-a7c3-0c65c9f06cb9`
- **Owner ID:** `4f1bd4a8-2e6a-42f5-847f-f7232293885b`
- **Verification:** The record was untouched, preserved with all original attributes.

---

## 7. Backend Tests

Executed the full backend test suite (`npm test` in `apps/api`):

```text
PASS test/meetings.spec.ts (6.261 s)
PASS test/leads.spec.ts
PASS test/auth.spec.ts
PASS test/activities.spec.ts
PASS test/customers.spec.ts
PASS test/rbac.spec.ts
PASS test/deals.spec.ts
PASS test/proposals.spec.ts
PASS test/tasks.spec.ts
PASS test/security.spec.ts
PASS test/health.spec.ts

Test Suites: 11 passed, 11 total
Tests:       90 passed, 90 total
Snapshots:   0 total
Time:        10.597 s
```
- **Result:** **100% Pass** (11/11 suites, 90/90 tests).

---

## 8. Frontend Build

Executed the production frontend build (`npm run build` in root):

```text
> digitechzo-crm@0.1.0 build
> tsc -b && vite build

vite v6.4.3 building for production...
transforming...
✓ 1762 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.91 kB │ gzip:   0.51 kB
dist/assets/index-DIVeCwhZ.css   47.86 kB │ gzip:   8.73 kB
dist/assets/index-TnFJ3THb.js   776.57 kB │ gzip: 208.96 kB
✓ built in 12.41s
```
- **Result:** **Success** (zero TypeScript compilation or bundling errors).

---

## 9. MariaDB Verification

- **Port:** `3306`
- **Process ID:** `5436`
- **Status:** `LISTENING`
- **Verification:** Completely untouched throughout all operations.

---

## 10. Exact Files Changed

- **Files modified for this task:** **None (Zero code files modified)**.
- Only database state was populated via `npm run prisma:seed` and local Prisma Client artifacts were generated via `npm run prisma:generate`.
- No migrations created. No database reset or tables dropped. No frontend UI modifications made.
