# DigiTechzo CRM — Team Module Frontend ↔ Backend Gap Audit

**Date:** October 7, 2026  
**Module:** Team / User Management (`src/pages/team/TeamPage.tsx`)  
**Audit Type:** READ-ONLY ARCHITECTURAL & INTEGRATION AUDIT  
**Status:** COMPLETE (NO CODE OR DATABASE MODIFICATIONS PERFORMED)  

---

## Executive Summary

The DigiTechzo CRM frontend currently renders the **Team** module using static in-memory mock data (`MOCK_USERS` from `src/mocks/mockAuth.ts`). The NestJS backend provides authentication and current-identity retrieval (`GET /api/v1/auth/me`, `GET /api/v1/users/me`), but **completely lacks organizational user-management CRUD endpoints** (`GET /api/v1/users`, `POST /api/v1/users`, `PATCH /api/v1/users/:id`, `DELETE /api/v1/users/:id`, `GET /api/v1/roles`).

However, the PostgreSQL database schema (`User`, `Role`, `Permission`, `RolePermission`, `Organization`) and RBAC permissions (`users:read`, `users:create`, `users:update`, `users:delete`, `roles:read`) are **already fully in place and seeded**. No database migrations or schema alterations are required. The integration requires only backend controller/service/DTO additions and frontend TanStack Query connection.

---

## A. Current Frontend Team Functionality

The Team page at `src/pages/team/TeamPage.tsx` currently provides:

1. **Header & Summary Metrics:**
   - Active user count badge (`{count} members`).
   - "Total Active Members" metric card.
   - "Sales Execution Team" metric card (`{bdeCount} BDEs`).
   - "Invite Member" primary CTA button.

2. **Search & Filter Controls:**
   - Search input filtering by name, email, or team.
   - Filter pills: `All Roles`, `BDE`, `Sales Manager`, `Admin`.
   - Reset filter action.

3. **Directory Presentation:**
   - **Desktop Table View (≥768px):** Member (Avatar, full name, email), Role badge, Team name, Data Scope indicator ("All Records", "Team Records", "Assigned Only"), Status badge ("Active" / "Inactive"), and "View Profile" action.
   - **Mobile Stacked Cards View (<768px):** Responsive card transformations for small viewports.

4. **Member Profile & Capabilities Modal:**
   - Displays avatar, name, email, role, team name, and data scope.
   - Displays a static "Documented RBAC Capabilities Matrix" detailing permissions per role according to `docs/AUTH-RBAC.md`.

5. **Invite Member Modal:**
   - Form fields: First Name, Last Name, Work Email, Role selector (`BDE`, `SALES_MANAGER`, `ADMIN`), and Team Name.
   - Displays a demo mode notice: *"Appends temporarily to local React state. No real email invitation is sent and no persistent database record is created."*
   - Appends submitted user directly to local React state.

---

## B. Current Mock Data in Use

1. **Source:** `src/mocks/mockAuth.ts`
   - Defines `MOCK_USERS`:
     - `user-1`: Arjun Verma (`arjun.v@digitechzo.com`, Role: `BDE`, Team: `Inbound Growth Team`)
     - `user-2`: Priya Sharma (`priya.s@digitechzo.com`, Role: `BDE`, Team: `Inbound Growth Team`)
     - `user-3`: Vikram Malhotra (`vikram.m@digitechzo.com`, Role: `SALES_MANAGER`, Team: `Inbound Growth Team`)
     - `user-admin`: Aditya Rao (`admin@digitechzo.com`, Role: `ADMIN`)
2. **State Management:**
   - `TeamPage.tsx` initializes `const [members, setMembers] = useState<TeamMemberItem[]>(INITIAL_MEMBERS)`.
   - Any added member persists only in local component memory and disappears on page refresh.

---

## C. Existing Backend Endpoints

Currently implemented in NestJS:

| Endpoint | Controller / Service | Guard / Decorators | Description |
|:---|:---|:---|:---|
| `GET /api/v1/users/me` | `UsersController.getMe` | `@UseGuards(JwtAuthGuard)` | Returns authenticated user profile, organization, role, and permission matrix. |
| `GET /api/v1/auth/me` | `AuthController.me` | `@UseGuards(JwtAuthGuard)` | Returns current user identity. |
| `POST /api/v1/auth/login` | `AuthController.login` | `@Public()` | Authenticates user with email & password. |
| `POST /api/v1/auth/refresh` | `AuthController.refresh` | `@Public()` | Rotates refresh token. |
| `POST /api/v1/auth/logout` | `AuthController.logout` | `@UseGuards(JwtAuthGuard)` | Revokes session refresh token. |

---

## D. Missing Backend Endpoints

The following endpoints are **currently missing** in the backend:

| Missing Endpoint | Method | Required Permission | Description |
|:---|:---|:---|:---|
| `/api/v1/users` | `GET` | `users:read` | List organization users with search, role filter, status filter, and pagination. |
| `/api/v1/users/:id` | `GET` | `users:read` | Retrieve specific user details by ID within current organization. |
| `/api/v1/users` | `POST` | `users:create` | Create/onboard a new user with initial password hash, role, and organization tenancy. |
| `/api/v1/users/:id` | `PATCH` | `users:update` | Update user details (name, phone, roleId, status). |
| `/api/v1/users/:id` | `DELETE` | `users:delete` | Soft-deactivate user account (set `status = 'INACTIVE'`). |
| `/api/v1/roles` | `GET` | `roles:read` | List available roles in system (`ADMIN`, `MANAGER`, `BDE_SALES`, etc.) for dropdown. |

---

## E. Existing Database Support

Direct read-only inspection of PostgreSQL (`localhost:5432/digitechzo_crm`) confirmed:

1. **`organizations` Table:**
   - 1 active organization: `DigiTechzo Media & Technologies Pvt Ltd` (`3a217382-421b-47ae-a7c3-0c65c9f06cb9`).
2. **`roles` Table (5 system roles):**
   - `ADMIN` (`e13587b0-fcd1-4747-8a51-8f98b7889e3f`) — 38 permissions
   - `MANAGER` (`eeefc741-bbc8-4fa6-a4b0-0045c4e4b510`) — 26 permissions
   - `BDE_SALES` (`d86822e5-4d7e-4eec-9e6d-c7a3e5d6d27a`) — 22 permissions
   - `MARKETING` (`57fb8553-ae1e-4597-8716-8d9184078c7f`) — 0 permissions
   - `DELIVERY` (`74ba33c2-7180-4d73-bf38-7f021767bec8`) — 0 permissions
3. **`users` Table:**
   - 1 active user: `DigiTechzo Administrator` (`admin@digitechzo.com`, role: `ADMIN`).
   - Columns: `id`, `organization_id`, `role_id`, `name`, `email`, `phone`, `password_hash`, `status`, `created_at`, `updated_at`.
4. **`permissions` Table (6 user/role permissions already seeded):**
   - `users:read`: View user accounts
   - `users:create`: Create user accounts
   - `users:update`: Update user accounts
   - `users:delete`: Deactivate user accounts
   - `roles:read`: View roles and permissions
   - `roles:update`: Modify role permission assignments

---

## F. RBAC & Security Requirements

1. **Strict Multi-Tenancy Scoping:**
   - All user listing, detail, creation, editing, and deactivation operations must strictly filter by `where: { organizationId: user.organizationId }`.
   - Cross-tenant access must return `404 Not Found`.

2. **No Password Leakage:**
   - `passwordHash` must NEVER be selected or returned in any DTO or API response.
   - User response DTOs must explicitly exclude `passwordHash`.

3. **Secure User Creation:**
   - When creating/inviting a user via `POST /api/v1/users`, password hashing must use Argon2id (already available via `argon2` in `AuthService`).
   - Initial temporary passwords must satisfy minimum security complexity (min 8 chars, uppercase, lowercase, number, special char).

4. **Self-Lockout Prevention:**
   - An administrator must NOT be permitted to deactivate or delete their own account (`if (targetUser.id === user.userId) throw BadRequestException('Cannot deactivate your own account')`).
   - Non-administrators must NOT be permitted to create or elevate a user to the `ADMIN` role.

5. **Audit Trail:**
   - User creation, role changes, status updates, and deactivations must record entries in `audit_logs` using `AuditService.record()`.

---

## G. Frontend ↔ Backend Field Name Mappings

| Frontend UI Concept | Prisma Database Model | Mapping Strategy |
|:---|:---|:---|
| First & Last Name | `User.name` (single string) | In `POST /api/v1/users`: Combine `name = "${firstName} ${lastName}".trim()`. In frontend display: Split by whitespace into `firstName` and `lastName`. |
| Role: `ADMIN` | `Role.name = "ADMIN"` | Direct match (1:1). |
| Role: `SALES_MANAGER` | `Role.name = "MANAGER"` | Bidirectional alias mapping (`MANAGER` ↔ `SALES_MANAGER`). |
| Role: `BDE` | `Role.name = "BDE_SALES"` | Bidirectional alias mapping (`BDE_SALES` ↔ `BDE`). |
| Status: `Active` / `Inactive` | `User.status = "ACTIVE" / "INACTIVE"` | Uppercase/lowercase normalization. |
| Team Name | *(Not in database schema)* | Derive safe department from role/organization (e.g. `BDE_SALES` → "Sales & Growth Team", `ADMIN` → "Leadership & Operations") or display Organization name. |

---

## H. Whether Prisma Migration Is Required

**NO.**  
No Prisma schema migration or database changes are required. All necessary models (`User`, `Role`, `Permission`, `RolePermission`, `Organization`), fields, foreign keys, and indexes already exist in PostgreSQL.

---

## I. Required Implementation Files

When ready to implement, the required changes are:

### Backend:
1. `apps/api/src/modules/users/dto/create-user.dto.ts` — Validation for onboarding users.
2. `apps/api/src/modules/users/dto/update-user.dto.ts` — Validation for editing name, role, phone, status.
3. `apps/api/src/modules/users/dto/user-query.dto.ts` — Filtering & pagination for user directory.
4. `apps/api/src/modules/users/dto/user-response.dto.ts` — Safe response DTO without `passwordHash`.
5. `apps/api/src/modules/users/users.service.ts` — Implement `findAll`, `findById`, `create`, `update`, `remove`.
6. `apps/api/src/modules/users/users.controller.ts` — Implement endpoints with `@Permissions(...)` decorators.
7. `apps/api/src/modules/roles/roles.controller.ts` — Expose `GET /api/v1/roles` using existing `RolesService.findAll()`.
8. `apps/api/src/modules/roles/roles.module.ts` — Register `RolesController`.

### Frontend:
1. `src/types/crm.ts` / `src/types/auth.ts` — Add `TeamUserItem`, `CreateUserPayload`, `UpdateUserPayload`, `RoleItem`.
2. `src/lib/api.ts` — Add `getUsers`, `getUser`, `createUser`, `updateUser`, `deleteUser`, `getRoles`.
3. `src/pages/team/TeamPage.tsx` — Connect to `crmApi.getUsers` and `crmApi.getRoles` via TanStack Query.

---

## J. Recommended Implementation Sequence

1. **Phase 1 — Backend Roles Endpoint:**
   - Expose `GET /api/v1/roles` via `RolesController` to provide role UUIDs to the client.
2. **Phase 2 — Backend Users DTOs & Service:**
   - Create user DTOs (`create-user`, `update-user`, `user-query`, `user-response`).
   - Extend `UsersService` with tenant-scoped query, create, update, and deactivation logic with Argon2id password hashing and audit logging.
3. **Phase 3 — Backend Users Controller:**
   - Add `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, and `DELETE /:id` to `UsersController` protected by RBAC permissions.
4. **Phase 4 — Backend Verification:**
   - Run `npm test` in `apps/api` (ensure 92+ tests pass) and `npm run build`.
5. **Phase 5 — Frontend API Client & Types:**
   - Add typed methods in `src/lib/api.ts` and `src/types/crm.ts`.
6. **Phase 6 — Frontend TeamPage Integration:**
   - Replace `INITIAL_MEMBERS` with TanStack Query.
   - Connect Invite Member modal to `crmApi.createUser`.
   - Connect role filtering to real role data.
7. **Phase 7 — End-to-End Verification:**
   - Verify unauthenticated rejection (401), admin user list (200), user creation (201), user update (200), user deactivation, and database persistence in PostgreSQL.

---

## K. Strict Constraints & Safeguards

- **MariaDB:** Port 3306 must remain 100% untouched.
- **PostgreSQL Database:** No migrations, table drops, or column alterations.
- **No Admin Bypass:** RBAC must enforce `users:read`, `users:create`, `users:update`, `users:delete` strictly through `PermissionsGuard`.
- **UI Integrity:** Preserve existing TeamPage layout, metric cards, table headers, avatars, and RBAC matrix modal.
