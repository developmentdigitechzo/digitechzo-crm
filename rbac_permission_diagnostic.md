# DigiTechzo CRM — RBAC & Permission Database Diagnostic Report

**Audit Date:** 2026-10-07  
**Scope:** Diagnostic Only — No code or database modifications  
**Target Environment:** Localhost (NestJS API on port 4000, PostgreSQL on port 5432)  
**Database Name:** `digitechzo_crm` (PostgreSQL `public` schema)  

---

## Executive Summary

During the full CRM frontend-to-backend-to-database audit, it was discovered that:
- The `permissions` table contains **0 rows**.
- The `role_permissions` table contains **0 rows**.
- The `pipeline_stages` table contains **0 rows**.
- The `lost_reasons` table contains **0 rows**.

Consequently, when any user—including `admin@digitechzo.com` (`ADMIN` role)—authenticates, the backend generates a JWT token with an empty permission list (`"permissions": []`). Because the global NestJS `PermissionsGuard` strictly verifies required permission keys against `user.permissions` without an `ADMIN` role bypass, all controller endpoints decorated with `@Permissions(...)` (such as `GET /api/v1/leads`) reject requests with **HTTP 403 Forbidden** (`Access denied: Missing required permission(s) [leads:read]`).

This report provides the full forensic trace of the database state, seed configuration, authentication flow, guard logic, live endpoint test results, exact root cause, and the safest remediation path.

---

## 1. Current PostgreSQL Database State

All metrics below were gathered directly from the live PostgreSQL instance (`localhost:5432/digitechzo_crm`) via Prisma Client:

| Entity / Table | Current Count | Key Records / Details |
| :--- | :---: | :--- |
| **organizations** | **1** | Name: `DigiTechzo Media & Technologies Pvt Ltd`<br>Slug: `digitechzo`<br>Status: `ACTIVE`<br>ID: `3a217382-421b-47ae-a7c3-0c65c9f06cb9`<br>Created At: `2026-10-07T05:58:12.749Z` |
| **users** | **1** | Email: `admin@digitechzo.com`<br>Name: `DigiTechzo Administrator`<br>Status: `ACTIVE`<br>Role: `ADMIN`<br>ID: `83bb175b-5fc1-460f-b258-cf49fb2194b9`<br>Created At: `2026-10-07T05:58:12.984Z` |
| **roles** | **5** | System roles: `ADMIN`, `MANAGER`, `BDE_SALES`, `MARKETING`, `DELIVERY`<br>Created At: `2026-10-07T05:58:12.788Z` – `12.799Z` |
| **permissions** | **0** | Empty table |
| **role_permissions** | **0** | Empty table |
| **pipeline_stages** | **0** | Empty table |
| **lost_reasons** | **0** | Empty table |
| **leads** | **1** | Name: `Kaniga`<br>Status: `NEW`<br>Priority: `MEDIUM`<br>Org: `3a217382-421b-47ae-a7c3-0c65c9f06cb9`<br>Created At: `2026-10-07T10:19:35.318Z` |
| **deals** | **0** | Empty table |
| **tasks** | **0** | Empty table |
| **activities** | **0** | Empty table |
| **meetings** | **0** | Empty table |
| **proposals** | **0** | Empty table |
| **customers** | **0** | Empty table |
| **refresh_tokens** | **3** | Active session tokens |
| **audit_logs** | **3** | Actions: `LOGIN_SUCCESS`, `REFRESH_TOKEN_ROTATED`, `LEAD_CREATED` |

### Role Breakdown

| Role Name | Description | `isSystem` | Assigned Permissions Count |
| :--- | :--- | :---: | :---: |
| `ADMIN` | Full system administration and control | `true` | **0** |
| `MANAGER` | Team management, pipeline approvals, and reporting | `true` | **0** |
| `BDE_SALES` | Business development, leads, deals, and tasks | `true` | **0** |
| `MARKETING` | Campaign management and inbound lead qualification | `true` | **0** |
| `DELIVERY` | Customer onboarding and service delivery handoff | `true` | **0** |

---

## 2. Expected Seed State (`apps/api/prisma/seed.ts`)

Inspection of `apps/api/prisma/seed.ts` indicates the target configuration that was designed to be seeded:

### A. Permissions Defined (38 Total across 10 Domains)
1. **users** (4): `users:read`, `users:create`, `users:update`, `users:delete`
2. **roles** (2): `roles:read`, `roles:update`
3. **audit_logs** (1): `audit_logs:read`
4. **settings** (2): `settings:read`, `settings:update`
5. **leads** (4): `leads:read`, `leads:create`, `leads:update`, `leads:delete`
6. **deals** (4): `deals:read`, `deals:create`, `deals:update`, `deals:delete`
7. **tasks** (4): `tasks:read`, `tasks:create`, `tasks:update`, `tasks:delete`
8. **activities** (4): `activities:read`, `activities:create`, `activities:update`, `activities:delete`
9. **meetings** (4): `meetings:read`, `meetings:create`, `meetings:update`, `meetings:delete`
10. **proposals** (4): `proposals:read`, `proposals:create`, `proposals:update`, `proposals:delete`
11. **customers** (4): `customers:read`, `customers:create`, `customers:update`, `customers:delete`
12. **reports** (1): `reports:read`

### B. Role Permission Mapping Designed
- **`ADMIN`**: All 38 permissions mapped via `prisma.rolePermission.upsert`.
- **`MANAGER`**: 23 departmental and managerial permissions.
- **`BDE_SALES`**: 16 operational sales permissions.
- **`MARKETING`** & **`DELIVERY`**: Reserved for specialized operational matrices.

### C. Reference Pipeline Stages Designed (6 Stages)
1. `Qualification` (Order 1, OPEN)
2. `Discovery` (Order 2, OPEN)
3. `Proposal Sent` (Order 3, OPEN)
4. `Negotiation` (Order 4, OPEN)
5. `Closed Won` (Order 5, WON)
6. `Closed Lost` (Order 6, LOST)

### D. Reference Lost Reasons Designed (5 Codes)
`PRICE_TOO_HIGH`, `COMPETITOR_CHOSEN`, `TIMING_POSTPONED`, `POOR_FIT`, `UNRESPONSIVE`.

---

## 3. Database Connection & Environment Verification

Verification confirmed that the running NestJS API and the Prisma CLI connect to the exact same PostgreSQL database:

| Component | Target Host | Port | Database Name | Schema | Status |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **NestJS Server** | `localhost` | `5432` | `digitechzo_crm` | `public` | Connected (PID 27956, HTTP Port 4000) |
| **Prisma CLI / Studio** | `localhost` | `5432` | `digitechzo_crm` | `public` | Connected (`apps/api/.env`) |
| **MariaDB (Separate)** | `0.0.0.0` | `3306` | — | — | Running untouched (PID 5436) |

*Credentials note: Sensitive database passwords and secrets have been redacted in compliance with security guidelines.*

---

## 4. Authentication & Authorization Flow Trace

### Step 1: User Login (`POST /api/v1/auth/login`)
- File: [`auth.service.ts`](file:///C:/DigiTechzo%20CRM/apps/api/src/modules/auth/auth.service.ts)
- `validateUser()` verifies the Argon2id password hash for `admin@digitechzo.com`.
- Line 107 executes:
  ```typescript
  const permissions = await this.permissionsService.findByRole(user.roleId);
  ```
- File: [`permissions.service.ts`](file:///C:/DigiTechzo%20CRM/apps/api/src/modules/permissions/permissions.service.ts)
  ```typescript
  async findByRole(roleId: string): Promise<string[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    return rolePermissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`);
  }
  ```
- **Result:** Because `role_permissions` has 0 rows, `findByRole(user.roleId)` returns an empty array `[]`.

### Step 2: JWT Token Creation
- The payload signed by JWT is:
  ```json
  {
    "sub": "83bb175b-5fc1-460f-b258-cf49fb2194b9",
    "email": "admin@digitechzo.com",
    "role": "ADMIN",
    "permissions": [],
    "organizationId": "3a217382-421b-47ae-a7c3-0c65c9f06cb9"
  }
  ```
- The decoded token contains `"permissions": []`.

### Step 3: Permissions Guard Inspection
- File: [`permissions.guard.ts`](file:///C:/DigiTechzo%20CRM/apps/api/src/common/guards/permissions.guard.ts)
- Registered globally in `app.module.ts`:
  ```typescript
  {
    provide: APP_GUARD,
    useClass: PermissionsGuard,
  }
  ```
- Guard logic:
  ```typescript
  const user = request.user;
  const userPermissions = user.permissions || [];
  const hasAllPermissions = requiredPermissions.every((perm) =>
    userPermissions.includes(perm),
  );
  if (!hasAllPermissions) {
    throw new ForbiddenException(
      `Access denied: Missing required permission(s) [${requiredPermissions.join(', ')}]`,
    );
  }
  ```
- **Observations:**
  1. The guard checks permissions **strictly against the JWT payload** (`request.user.permissions`), not by querying PostgreSQL on every request.
  2. There is **NO `ADMIN` role bypass**. Even if `user.role === 'ADMIN'`, if the requested permission string is missing from `user.permissions`, the guard throws `ForbiddenException`.
  3. No `SUPER_ADMIN` role exists in the schema or code.

---

## 5. Live Authorization Test Results

### Test A: Unprotected Profile Endpoint
- **Request:** `GET http://localhost:4000/api/v1/users/me`
- **Guards:** `@UseGuards(JwtAuthGuard)` (no `@Permissions` decorator)
- **Status:** **`HTTP 200 OK`**
- **Response:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": {
      "id": "83bb175b-5fc1-460f-b258-cf49fb2194b9",
      "name": "DigiTechzo Administrator",
      "email": "admin@digitechzo.com",
      "status": "ACTIVE",
      "role": { "name": "ADMIN" },
      "permissions": []
    }
  }
  ```

### Test B: Protected Leads Endpoint
- **Request:** `GET http://localhost:4000/api/v1/leads`
- **Guards:** `@Permissions('leads:read')` + `PermissionsGuard`
- **Status:** **`HTTP 403 Forbidden`**
- **Response:**
  ```json
  {
    "success": false,
    "statusCode": 403,
    "error": "Forbidden",
    "message": "Access denied: Missing required permission(s) [leads:read]",
    "path": "/api/v1/leads"
  }
  ```

---

## 6. Root Cause Analysis

### Conclusion: Option F (Combination of Partial Initial Setup & Missing Prisma Seed Hook)

1. **Partial Initial Database Setup:**
   - At `2026-10-07T05:58:12Z`, the initial records for `organizations`, `roles`, and `users` were inserted into PostgreSQL.
   - However, the loops for inserting permissions (`prisma.permission.upsert`), role-permission mappings (`prisma.rolePermission.upsert`), `pipeline_stages`, and `lost_reasons` were not executed at that time (or were executed before `permissionsData` was added to `seed.ts`).

2. **Absence of Automatic Prisma Seed Configuration:**
   - In `apps/api/package.json`, there is no `"prisma": { "seed": "ts-node prisma/seed.ts" }` definition.
   - Therefore, when subsequent Prisma migrations were executed (`20261007065200`, `20261007082925`, `20261007085519`), Prisma CLI **did not automatically invoke `seed.ts`**.

3. **Strict Audit / Testing Instructions:**
   - All subsequent prompts and instructions strictly forbade executing any seed or database modification (`DO NOT run seed`, `DO NOT modify database data`).
   - Consequently, the `permissions` and `role_permissions` tables remained at **0 rows**.

4. **Strict Guard Enforcement Without Admin Bypass:**
   - Because `PermissionsGuard` checks only `user.permissions` in the JWT and contains no fallback/bypass for `ADMIN`, the empty table condition directly locks the administrator out of any endpoint protected by `@Permissions(...)`.

---

## 7. Safest Remediation Recommendations

When approval is granted to resolve this issue, the safest, non-destructive remediation sequence is:

### Option 1: Execute Idempotent Prisma Seed (Recommended)
`apps/api/prisma/seed.ts` is already written using `upsert` operations:
- It checks existing records by unique keys (`slug` for Organization, `name` for Roles, `[resource, action]` for Permissions, and `[roleId, permissionId]` for RolePermissions).
- Running `npm run prisma:seed` in `apps/api/` will **NOT** delete or alter existing leads, organizations, or users.
- It will simply populate the 38 missing permissions, map them to the existing roles, and populate reference pipeline stages and lost reasons.

### Option 2: Add Defense-in-Depth Admin Bypass to `PermissionsGuard` (Complementary)
In [`permissions.guard.ts`](file:///C:/DigiTechzo%20CRM/apps/api/src/common/guards/permissions.guard.ts), add a standard administrative bypass:
```typescript
if (user.role === 'ADMIN') {
  return true;
}
```
This guarantees that the system administrator is never accidentally locked out of operational APIs even during maintenance or partial seed states, while standard RBAC continues to govern all other user roles (`MANAGER`, `BDE_SALES`, `MARKETING`, `DELIVERY`).

---

## 8. Summary Table of Verification Points

| Diagnostic Requirement | Result |
| :--- | :--- |
| Current permissions table count | **0 rows** |
| Current role_permissions table count | **0 rows** |
| Current roles count | **5 rows** (all have 0 assigned permissions) |
| Current user (`admin@digitechzo.com`) role | `ADMIN` |
| Permissions returned in user JWT | `[]` (empty array) |
| API Database vs Prisma Database | **Identical** (`localhost:5432/digitechzo_crm`) |
| MariaDB port 3306 status | **Running untouched** (PID 5436) |
| `GET /api/v1/leads` authorization result | **403 Forbidden** (`Missing required permission(s) [leads:read]`) |
| Code or database modified during diagnostic | **None (Zero changes)** |

