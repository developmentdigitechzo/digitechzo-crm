# Step B1 — Backend Foundation & Authentication Implementation Plan

> **STATUS:** SPECIFICATION / DETAILED IMPLEMENTATION PLAN  
> **Phase:** B1 — Backend Foundation + Database + Authentication  
> **Target Subsystem:** `apps/api` (NestJS Modular Monolith)  
> **Rule:** Non-negotiable frontend freeze. All E1–E10 frontend files remain 100% untouched.

---

## 1. Discovered Current Project State

An exhaustive audit of the workspace was conducted prior to authoring this implementation plan:

1. **Frontend Architecture:**
   - The root workspace (`C:\DigiTechzo CRM`) contains a single Vite + React + Tailwind Single Page Application.
   - `src/` houses the approved and frozen modules:
     - `src/pages/leads/` (E1 — Approved)
     - `src/pages/pipeline/` (E2 — Approved)
     - `src/pages/tasks/` (E3 — Approved)
     - `src/pages/activities/` (E4 — Approved)
     - `src/pages/meetings/` (E5 — Approved)
     - `src/pages/proposals/` (E6 — Approved)
     - `src/pages/customers/` (E7 — Approved)
     - `src/pages/team/` (E8 — Approved)
     - `src/pages/settings/` (E9 — Approved)
     - `src/pages/reports/` (E10 — Approved)
   - All frontend data grounding is currently based on static mock seed data in `src/mocks/mockData.ts` and `src/mocks/mockAuth.ts`.
2. **Existing Backend / API Code:**
   - **Zero backend application source code exists.**
   - No NestJS files, no Express server, no controllers, and no services are present.
3. **Database & Persistence State:**
   - **Zero Prisma schemas or migration files exist.**
   - Docker daemon is not installed / unavailable in the current environment (`docker: command not found`).
   - PostgreSQL service is not currently listening on `localhost:5432`.
   - Node.js runtime is **v24.18.1**; npm package manager is **v11.16.0**.
4. **Configuration & Tooling:**
   - Root `package.json` contains only frontend dependencies (`react`, `@tanstack/react-query`, `@dnd-kit`, etc.).
   - `.gitignore` ignores standard logs, `node_modules`, `dist`, and `.env*` files.

---

## 2. Structural Strategy & Monorepo Directory Architecture

To guarantee the **Non-Negotiable Frontend Freeze**, the backend foundation will be organized cleanly in an isolated application folder:

```
C:\DigiTechzo CRM\
├── apps/
│   └── api/                                   # Backend NestJS Modular Monolith
│       ├── prisma/
│       │   ├── schema.prisma                  # PostgreSQL Prisma schema definition
│       │   ├── seed.ts                        # Foundation seed script (Org, Roles, Stages)
│       │   └── migrations/                    # Version-controlled SQL migrations
│       │
│       ├── src/
│       │   ├── main.ts                        # NestJS bootstrap, Swagger, global pipes
│       │   ├── app.module.ts                  # Root application module
│       │   │
│       │   ├── config/                        # Configuration & Joi/Zod validation
│       │   │   ├── app.config.ts
│       │   │   ├── auth.config.ts
│       │   │   ├── database.config.ts
│       │   │   └── env.validation.ts
│       │   │
│       │   ├── common/                        # Cross-cutting reusable infrastructure
│       │   │   ├── decorators/                # @CurrentUser(), @Roles(), @Permissions()
│       │   │   ├── dto/                       # Standard ApiResponseDto, ErrorResponseDto
│       │   │   ├── filters/                   # AllExceptionsFilter, PrismaExceptionFilter
│       │   │   ├── guards/                    # JwtAuthGuard, RolesGuard, PermissionsGuard
│       │   │   ├── interceptors/              # RequestIdInterceptor, AuditLogInterceptor
│       │   │   └── pipes/                     # Custom ValidationPipe (whitelist, transform)
│       │   │
│       │   ├── database/                      # Prisma Client Service & Module
│       │   │   ├── prisma.service.ts
│       │   │   └── prisma.module.ts
│       │   │
│       │   └── modules/                       # B1 Business Feature Modules
│       │       ├── health/                    # HealthController, HealthService (/api/v1/health)
│       │       ├── auth/                      # AuthController, AuthService, JwtStrategy, DTOs
│       │       ├── users/                     # UsersController, UsersService, UsersRepository
│       │       ├── roles/                     # RolesService, RolesRepository
│       │       ├── permissions/               # PermissionsService, resource-action definitions
│       │       └── audit/                     # AuditLogService, AuditLogRepository
│       │
│       ├── test/                              # Automated Unit and Integration Test Suites
│       │   ├── auth.spec.ts                   # Login, Argon2id, Refresh rotation, Revocation
│       │   ├── rbac.spec.ts                   # Role & Permission authorization guards
│       │   ├── health.spec.ts                 # Healthcheck endpoint verification
│       │   └── security.spec.ts               # Password redaction, token handling
│       │
│       ├── .env.example                       # Documented environment variables
│       ├── nest-cli.json                      # NestJS CLI configuration
│       ├── tsconfig.json                      # Backend TypeScript configuration
│       └── package.json                       # Backend dedicated dependencies & scripts
│
├── src/                                       # FROZEN FRONTEND (E1–E10) — UNTOUCHED
├── docs/                                      # Project Documentation
└── package.json                               # Root package configuration
```

---

## 3. Files Impact Matrix

### 3.1 Files to be Created (Strictly within `apps/api/` and `docs/backend/`)
* **Configuration & Build:**
  - `apps/api/package.json`
  - `apps/api/tsconfig.json`
  - `apps/api/nest-cli.json`
  - `apps/api/.env.example`
* **Prisma & Database:**
  - `apps/api/prisma/schema.prisma`
  - `apps/api/prisma/seed.ts`
* **Application Core:**
  - `apps/api/src/main.ts`
  - `apps/api/src/app.module.ts`
* **Configuration Module:**
  - `apps/api/src/config/app.config.ts`
  - `apps/api/src/config/auth.config.ts`
  - `apps/api/src/config/database.config.ts`
  - `apps/api/src/config/env.validation.ts`
* **Common Infrastructure:**
  - `apps/api/src/common/decorators/current-user.decorator.ts`
  - `apps/api/src/common/decorators/roles.decorator.ts`
  - `apps/api/src/common/decorators/permissions.decorator.ts`
  - `apps/api/src/common/guards/jwt-auth.guard.ts`
  - `apps/api/src/common/guards/roles.guard.ts`
  - `apps/api/src/common/guards/permissions.guard.ts`
  - `apps/api/src/common/interceptors/request-id.interceptor.ts`
  - `apps/api/src/common/interceptors/transform-response.interceptor.ts`
  - `apps/api/src/common/filters/http-exception.filter.ts`
  - `apps/api/src/common/dto/api-response.dto.ts`
  - `apps/api/src/common/dto/error-response.dto.ts`
* **Database & Persistence:**
  - `apps/api/src/database/prisma.service.ts`
  - `apps/api/src/database/prisma.module.ts`
* **Modules:**
  - `apps/api/src/modules/health/health.controller.ts`
  - `apps/api/src/modules/health/health.service.ts`
  - `apps/api/src/modules/health/health.module.ts`
  - `apps/api/src/modules/audit/audit.service.ts`
  - `apps/api/src/modules/audit/audit.module.ts`
  - `apps/api/src/modules/roles/roles.service.ts`
  - `apps/api/src/modules/roles/roles.module.ts`
  - `apps/api/src/modules/permissions/permissions.service.ts`
  - `apps/api/src/modules/permissions/permissions.module.ts`
  - `apps/api/src/modules/users/users.service.ts`
  - `apps/api/src/modules/users/users.controller.ts`
  - `apps/api/src/modules/users/users.module.ts`
  - `apps/api/src/modules/users/dto/user-profile.dto.ts`
  - `apps/api/src/modules/auth/auth.controller.ts`
  - `apps/api/src/modules/auth/auth.service.ts`
  - `apps/api/src/modules/auth/auth.module.ts`
  - `apps/api/src/modules/auth/jwt.strategy.ts`
  - `apps/api/src/modules/auth/dto/login.dto.ts`
  - `apps/api/src/modules/auth/dto/refresh-token.dto.ts`
* **Test Suites:**
  - `apps/api/test/auth.spec.ts`
  - `apps/api/test/rbac.spec.ts`
  - `apps/api/test/health.spec.ts`
  - `apps/api/test/security.spec.ts`
* **Documentation:**
  - `docs/backend/b1_implementation_plan.md`
  - `docs/backend/b1_technical_verification.md`

### 3.2 Files to be Modified
* **Root `.gitignore`:** Ensure `apps/api/dist/`, `apps/api/node_modules/`, and `apps/api/.env` are explicitly ignored.
* **Root `package.json`:** Add convenience root scripts (`"backend:build"`, `"backend:test"`, `"backend:typecheck"`) that delegate into `apps/api` without altering any existing frontend script.

### 3.3 Files That Must Remain Untouched (FROZEN)
* `src/pages/**` (All E1–E10 frontend modules)
* `src/layouts/**`
* `src/components/**`
* `src/mocks/**`
* `src/types/**`
* `src/hooks/**`
* `src/lib/**`
* `public/**`
* `index.html`
* `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`
* `tsconfig.app.json`, `tsconfig.node.json`

---

## 4. Database Architecture (Prisma & PostgreSQL)

The schema defines the exact 9 B1 entities using consistent UUID primary keys, foreign keys, timestamps, and indexes:

### 4.1 Schema Entity Specifications
1. **`Organization` (`organizations`):**
   - `id`: UUID `@id @default(uuid())`
   - `name`: String (e.g., "DigiTechzo")
   - `slug`: String `@unique`
   - `status`: String `@default("ACTIVE")`
   - `createdAt`, `updatedAt`: DateTime
2. **`User` (`users`):**
   - `id`: UUID `@id @default(uuid())`
   - `organizationId`: UUID -> `Organization.id`
   - `roleId`: UUID -> `Role.id`
   - `name`: String
   - `email`: String `@unique`
   - `phone`: String?
   - `passwordHash`: String (Argon2id hash)
   - `status`: String `@default("ACTIVE")` (`ACTIVE`, `INACTIVE`, `SUSPENDED`)
   - `createdAt`, `updatedAt`: DateTime
3. **`Role` (`roles`):**
   - `id`: UUID `@id @default(uuid())`
   - `name`: String `@unique` (`ADMIN`, `MANAGER`, `BDE_SALES`, `MARKETING`, `DELIVERY`)
   - `description`: String?
   - `isSystem`: Boolean `@default(true)`
   - `createdAt`, `updatedAt`: DateTime
4. **`Permission` (`permissions`):**
   - `id`: UUID `@id @default(uuid())`
   - `resource`: String (e.g. `users`, `roles`, `audit_logs`, `settings`)
   - `action`: String (e.g. `create`, `read`, `update`, `delete`, `manage`)
   - `description`: String?
   - `@unique([resource, action])`
5. **`RolePermission` (`role_permissions`):**
   - `id`: UUID `@id @default(uuid())`
   - `roleId`: UUID -> `Role.id`
   - `permissionId`: UUID -> `Permission.id`
   - `@unique([roleId, permissionId])`
6. **`RefreshToken` (`refresh_tokens`):**
   - `id`: UUID `@id @default(uuid())`
   - `userId`: UUID -> `User.id`
   - `tokenHash`: String `@unique` (SHA-256 fingerprint; plaintext refresh token is never stored in DB)
   - `isRevoked`: Boolean `@default(false)`
   - `revokedAt`: DateTime?
   - `expiresAt`: DateTime
   - `ipAddress`: String?
   - `userAgent`: String?
   - `createdAt`: DateTime `@default(now())`
7. **`AuditLog` (`audit_logs`):**
   - `id`: UUID `@id @default(uuid())`
   - `organizationId`: UUID -> `Organization.id`
   - `userId`: UUID? -> `User.id`
   - `action`: String (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `REFRESH_TOKEN_ROTATED`, `REFRESH_TOKEN_REVOKED`, `ROLE_CHANGED`)
   - `resource`: String
   - `resourceId`: String?
   - `details`: Json?
   - `ipAddress`: String?
   - `userAgent`: String?
   - `requestId`: String?
   - `createdAt`: DateTime `@default(now())`
8. **`PipelineStage` (`pipeline_stages`):**
   - Reference/Configuration Table:
   - `id`: UUID `@id @default(uuid())`
   - `name`: String
   - `order`: Int
   - `stageType`: String (`OPEN`, `WON`, `LOST`)
   - `dealCountBenchmark`: Int `@default(0)`
   - `totalValueBenchmark`: Decimal `@default(0)`
   - `createdAt`, `updatedAt`: DateTime
9. **`LostReason` (`lost_reasons`):**
   - Reference/Configuration Table:
   - `id`: UUID `@id @default(uuid())`
   - `code`: String `@unique` (`PRICE_TOO_HIGH`, `COMPETITOR_CHOSEN`, etc.)
   - `label`: String
   - `isActive`: Boolean `@default(true)`
   - `createdAt`, `updatedAt`: DateTime

---

## 5. Authentication Architecture (Custom & Secure)

* **Hashing Algorithm:** Argon2id via `@node-rs/argon2` or `argon2`. No plaintext passwords.
* **Access Tokens:**
  - Standard JWT with HS256 / RS256 signature.
  - Expiration: **15 minutes**.
  - Payload claims: `sub` (userId), `email`, `organizationId`, `role` (roleName), `permissions` (array of `resource:action` strings).
  - Validated by `JwtStrategy` and `JwtAuthGuard`.
* **Refresh Tokens:**
  - High-entropy cryptographic random token generated with `crypto.randomBytes(48).toString('hex')`.
  - Stored in database as a SHA-256 hash (`crypto.createHash('sha256').update(rawToken).digest('hex')`).
  - Expiration: **7 days**.
  - Transmitted via JSON response body or `Set-Cookie` header (`__Host-refreshToken; HttpOnly; Secure; SameSite=Strict`).
* **Refresh Token Rotation & Reuse Detection:**
  - Upon calling `POST /api/v1/auth/refresh`, the presented token hash is matched in `refresh_tokens`.
  - If valid and not revoked:
    1. Mark current token record as `isRevoked = true, revokedAt = now()`.
    2. Generate a new Refresh Token and Access Token pair.
    3. Persist new Refresh Token hash.
    4. Log `REFRESH_TOKEN_ROTATED` to `audit_logs`.
    5. Return new access token and rotated refresh token.
  - If an already-revoked token is presented:
    - Automatic theft/compromise detection triggers: revoke ALL active refresh tokens for that user account, log critical audit violation, and return `401 Unauthorized`.
* **Logout:**
  - `POST /api/v1/auth/logout`: Revokes the active refresh token (`isRevoked = true, revokedAt = now()`), emits `LOGOUT` audit log, and invalidates session.

---

## 6. RBAC & Declarative Authorization Infrastructure

1. **Roles:** `ADMIN`, `MANAGER`, `BDE_SALES`, `MARKETING`, `DELIVERY`.
2. **Metadata Decorators:**
   - `@Roles(Role.ADMIN, Role.MANAGER)`
   - `@Permissions('users:read', 'users:write')`
   - `@CurrentUser()`
3. **Guards Pipeline:**
   ```
   Request ──► RequestIdInterceptor
          ──► JwtAuthGuard (Validates Bearer token & attaches req.user)
          ──► RolesGuard (Checks if req.user.role satisfies @Roles)
          ──► PermissionsGuard (Checks if req.user.permissions satisfies @Permissions)
          ──► Controller Handler
   ```

---

## 7. REST API Endpoints Specification (`/api/v1`)

| Method | Endpoint | Auth | Role / Permission | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/v1/health` | Public | None | Database connectivity & service uptime status |
| `POST` | `/api/v1/auth/login` | Public | None | Argon2id verification, issues JWT + Refresh Token |
| `POST` | `/api/v1/auth/refresh` | Public / Token | None | Rotates refresh token, issues new JWT |
| `POST` | `/api/v1/auth/logout` | Protected | Authenticated | Revokes refresh token, clears session |
| `GET` | `/api/v1/auth/me` | Protected | Authenticated | Returns current authenticated user and permissions |
| `GET` | `/api/v1/users/me` | Protected | Authenticated | Returns extended user profile and organization info |

### Swagger / OpenAPI:
* Documentation exposed at `/api/docs`.
* Bearer authentication registered as `JWT-auth`.

---

## 8. Implementation Sequence

```
[ Step 1: Initialize apps/api package.json, tsconfig.json, and install NestJS dependencies ]
                                      │
                                      ▼
[ Step 2: Define Prisma schema (9 B1 entities) & generate PrismaClient ]
                                      │
                                      ▼
[ Step 3: Implement ConfigModule with strict env validation & .env.example ]
                                      │
                                      ▼
[ Step 4: Implement DatabaseModule (PrismaService with connection lifecycle) ]
                                      │
                                      ▼
[ Step 5: Implement Common Infrastructure (RequestId, HttpExceptionFilter, DTOs, Guards) ]
                                      │
                                      ▼
[ Step 6: Implement AuditLogModule (Immutable audit log writer) ]
                                      │
                                      ▼
[ Step 7: Implement AuthModule (Argon2id, JwtStrategy, Refresh Rotation, Logout) ]
                                      │
                                      ▼
[ Step 8: Implement UsersModule (/api/v1/users/me) & Roles/Permissions Modules ]
                                      │
                                      ▼
[ Step 9: Implement HealthModule (/api/v1/health) ]
                                      │
                                      ▼
[ Step 10: Wire main.ts with Global Pipes, Swagger (/api/docs), and Prefix /api/v1 ]
                                      │
                                      ▼
[ Step 11: Create prisma/seed.ts (DigiTechzo org, 5 roles, reference stages/reasons) ]
                                      │
                                      ▼
[ Step 12: Write automated test suites (Auth, RBAC, Health, Security) ]
                                      │
                                      ▼
[ Step 13: Execute npm run typecheck, npm run build, and test verification ]
                                      │
                                      ▼
[ Step 14: Generate docs/backend/b1_technical_verification.md & STOP ]
```

---

## 9. Compatibility & Verification Sign-Off

* **Discovered Structure Compatibility:** Confirmed. Isolating the backend into `apps/api/` preserves 100% of the root frontend workspace without any risk of collision or dependency breakage.
* **No Scope Expansion:** Confirmed. No business domain modules (Leads, Deals, WhatsApp, AI, Telephony) are included in this plan.
