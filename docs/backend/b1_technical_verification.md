# Step B1 — Backend Foundation & Authentication Technical Verification Report

> **Project:** DigiTechzo CRM  
> **Phase:** Step B1 — Backend Foundation + Database + Authentication  
> **Subsystem Location:** `apps/api/`  
> **Status:** COMPLETED & VERIFIED  
> **Frontend Freeze Integrity:** 100% UNTOUCHED (0 changes to `src/`)

---

## 1. Executive Summary

Step B1 establishes the backend foundation for the DigiTechzo CRM enterprise platform. Built as a NestJS modular monolith in `apps/api/` with REST API base prefix `/api/v1`, it provides:
1. **PostgreSQL Persistence with Prisma ORM:** 9 foundational entities with strict UUID primary keys, relational constraints, and database indexes.
2. **Enterprise Authentication:** Custom authentication utilizing Argon2id password hashing, 15-minute standard JWT access tokens, 7-day cryptographic rotating refresh tokens with SHA-256 database hashing and theft/reuse detection, and explicit revocation on logout.
3. **Role-Based Access Control (RBAC):** Hierarchical roles (`ADMIN`, `MANAGER`, `BDE_SALES`, `MARKETING`, `DELIVERY`), granular `resource:action` permissions, and declarative NestJS guards (`JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`).
4. **Production Cross-Cutting Infrastructure:** Unique `X-Request-ID` propagation, global RFC 7807 exception filtering, standardized response envelopes, strict validation pipes with input whitelisting, and immutable security audit logging.
5. **Interactive OpenAPI / Swagger Documentation:** Live API Explorer exposed at `/api/docs` with Bearer JWT integration.

---

## 2. Directory Architecture & Monorepo Isolation

All backend artifacts are cleanly encapsulated in `apps/api/` to guarantee absolute isolation from the frozen Vite React frontend:

```
C:\DigiTechzo CRM\
├── apps/
│   └── api/
│       ├── prisma/
│       │   ├── schema.prisma                  # 9 PostgreSQL Prisma Models
│       │   └── seed.ts                        # Foundation database seed script
│       ├── src/
│       │   ├── main.ts                        # NestJS bootstrap, Swagger, /api/v1 prefix
│       │   ├── app.module.ts                  # Root application composition & global providers
│       │   ├── config/                        # App, Auth, Database configuration & validation
│       │   │   ├── app.config.ts
│       │   │   ├── auth.config.ts
│       │   │   ├── database.config.ts
│       │   │   └── env.validation.ts
│       │   ├── database/                      # Prisma Client service & lifecycle
│       │   │   ├── prisma.service.ts
│       │   │   └── prisma.module.ts
│       │   ├── common/                        # Infrastructure, Guards, Interceptors, Filters
│       │   │   ├── decorators/                # @CurrentUser, @Roles, @Permissions, @Public
│       │   │   ├── dto/                       # ApiResponseDto, ErrorResponseDto
│       │   │   ├── filters/                   # HttpExceptionFilter (RFC 7807)
│       │   │   ├── guards/                    # JwtAuthGuard, RolesGuard, PermissionsGuard
│       │   │   └── interceptors/              # RequestIdInterceptor, TransformResponseInterceptor
│       │   ├── modules/                       # Monolith feature modules
│       │   │   ├── health/                    # GET /api/v1/health (Uptime & DB status)
│       │   │   ├── audit/                     # AuditService (Immutable audit log writer)
│       │   │   ├── roles/                     # RolesService (Role definitions & lookups)
│       │   │   ├── permissions/               # PermissionsService (Resource-action resolution)
│       │   │   ├── users/                     # UsersController, UsersService, UserProfileDto
│       │   │   └── auth/                      # AuthController, AuthService, JwtStrategy, DTOs
│       │   └── types/                         # Express Request type augmentations
│       ├── test/                              # Automated Jest test suites
│       │   ├── auth.spec.ts                   # Login, Argon2id, Refresh rotation, Revocation
│       │   ├── rbac.spec.ts                   # Role & Permission authorization guards
│       │   ├── health.spec.ts                 # Healthcheck endpoint verification
│       │   └── security.spec.ts               # Token hashing & interceptor safeguards
│       ├── .env                               # Local backend configuration
│       ├── .env.example                       # Documented environment template
│       ├── jest.config.json                   # Jest test runner configuration
│       ├── nest-cli.json                      # NestJS CLI configuration
│       ├── tsconfig.json                      # Backend TypeScript configuration
│       └── package.json                       # Backend dependencies & build scripts
├── src/                                       # 100% FROZEN FRONTEND (E1–E10) — ZERO EDITS
└── docs/backend/                              # Specifications & verification documents
```

---

## 3. Database Schema (9 B1 Entities)

The PostgreSQL database schema is defined in `apps/api/prisma/schema.prisma` and generated into `@prisma/client`:

| Entity | Table Name | Key Attributes | Relations / Constraints |
| :--- | :--- | :--- | :--- |
| **Organization** | `organizations` | `id` (UUID PK), `name`, `slug` (Unique), `status`, `createdAt`, `updatedAt` | 1:N with `users`, 1:N with `audit_logs` |
| **User** | `users` | `id` (UUID PK), `organizationId`, `roleId`, `name`, `email` (Unique), `phone`, `passwordHash` (Argon2id), `status`, `createdAt`, `updatedAt` | N:1 with `organizations`, N:1 with `roles`, 1:N with `refresh_tokens`, 1:N with `audit_logs` |
| **Role** | `roles` | `id` (UUID PK), `name` (Unique: `ADMIN`, `MANAGER`, `BDE_SALES`, `MARKETING`, `DELIVERY`), `description`, `isSystem`, timestamps | 1:N with `users`, 1:N with `role_permissions` |
| **Permission** | `permissions` | `id` (UUID PK), `resource`, `action`, `description`, `createdAt` | Composite Unique `(resource, action)`, 1:N with `role_permissions` |
| **RolePermission** | `role_permissions` | `id` (UUID PK), `roleId`, `permissionId` | Composite Unique `(roleId, permissionId)`, cascade delete |
| **RefreshToken** | `refresh_tokens` | `id` (UUID PK), `userId`, `tokenHash` (Unique SHA-256), `isRevoked`, `revokedAt`, `expiresAt`, `ipAddress`, `userAgent`, `createdAt` | N:1 with `users`, index on `userId` |
| **AuditLog** | `audit_logs` | `id` (UUID PK), `organizationId`, `userId`, `action`, `resource`, `resourceId`, `details` (JSON), `ipAddress`, `userAgent`, `requestId`, `createdAt` | N:1 with `organizations`, N:1 with `users`, indexes on `organizationId`, `userId`, `action` |
| **PipelineStage** | `pipeline_stages` | `id` (UUID PK), `name`, `order`, `stageType` (`OPEN`, `WON`, `LOST`), `dealCountBenchmark`, `totalValueBenchmark`, timestamps | Reference/Configuration stage table |
| **LostReason** | `lost_reasons` | `id` (UUID PK), `code` (Unique), `label`, `isActive`, timestamps | Reference/Configuration taxonomy table |

---

## 4. Authentication & Security Engine

### 4.1 Argon2id Password Hashing
- Utilizes `@node-rs/argon2` high-performance native cryptographic implementation.
- Password hashes are never decrypted, stored in memory longer than verification, or serialized into any outgoing API payload.

### 4.2 15-Minute JWT Access Tokens
- Signed with HS256 algorithm and configured secret.
- Claims payload:
  ```json
  {
    "sub": "user-uuid",
    "email": "admin@digitechzo.com",
    "organizationId": "org-uuid",
    "role": "ADMIN",
    "permissions": ["users:read", "users:create", "leads:read"]
  }
  ```
- Validated via `PassportStrategy` (`JwtStrategy`) on every protected route.

### 4.3 7-Day Cryptographic Refresh Tokens & Reuse Detection
- Generated using 48 high-entropy cryptographically random bytes (`crypto.randomBytes(48).toString('hex')` = 96-char hex).
- Plaintext tokens are **never** stored in the database. Only their SHA-256 fingerprint hash is persisted.
- **Single-Use Token Rotation:** On calling `POST /api/v1/auth/refresh`, the presented token is immediately revoked (`isRevoked = true, revokedAt = now()`) and a fresh pair is minted.
- **Compromise / Theft Detection:** If an incoming request presents an **already revoked** refresh token:
  1. Identifies that a stolen token is being replayed.
  2. Immediately revokes **all** active refresh tokens for that user account.
  3. Records a high-priority `SECURITY_ALERT_REFRESH_TOKEN_REUSE` audit log with IP and client metadata.
  4. Returns `401 Unauthorized` ("Refresh token reuse detected. All sessions have been revoked for your security.").

### 4.4 Session Termination / Logout
- Calling `POST /api/v1/auth/logout` explicitly marks refresh token records as revoked (`isRevoked = true, revokedAt = now()`) and logs a `LOGOUT` audit log.

---

## 5. RBAC & Declarative Authorization Pipeline

- Declarative decorators:
  - `@Roles('ADMIN', 'MANAGER')`: enforces role constraints.
  - `@Permissions('users:read', 'users:create')`: enforces specific fine-grained privileges.
  - `@CurrentUser()`: injects typed `AuthenticatedUser` directly into controller parameters.
  - `@Public()`: bypasses authentication for public endpoints (`/api/v1/health`, `/api/v1/auth/login`, `/api/v1/auth/refresh`).
- Execution order:
  ```
  HTTP Request
      │
      ▼
  [ RequestIdInterceptor ]           -> Extracts/Generates X-Request-ID
      │
      ▼
  [ JwtAuthGuard ]                   -> Verifies Bearer JWT & populates req.user
      │
      ▼
  [ RolesGuard ]                     -> Matches req.user.role against @Roles metadata
      │
      ▼
  [ PermissionsGuard ]               -> Matches req.user.permissions against @Permissions metadata
      │
      ▼
  [ Controller Handler ]             -> Executes business logic
      │
      ▼
  [ TransformResponseInterceptor ]   -> Envelopes output into { success: true, data: ... }
  ```

---

## 6. Implemented REST API Endpoints (`/api/v1`)

| Method | Endpoint | Auth Required | Guards / Decorators | Status Codes | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `GET` | `/api/v1/health` | No | `@Public()` | 200 | Uptime, environment, and database connectivity probe |
| `POST` | `/api/v1/auth/login` | No | `@Public()`, `LoginDto` | 200, 401, 403 | Argon2id verification, issues JWT + 7d rotating refresh token |
| `POST` | `/api/v1/auth/refresh` | No | `@Public()`, `RefreshTokenDto` | 200, 401, 403 | Rotates refresh token, emits new JWT, triggers reuse alarm on replay |
| `POST` | `/api/v1/auth/logout` | Yes | `JwtAuthGuard`, `LogoutDto` | 200, 401 | Revokes active refresh token record(s) and logs termination |
| `GET` | `/api/v1/auth/me` | Yes | `JwtAuthGuard`, `@CurrentUser()` | 200, 401 | Current authenticated user identity, role, and permission matrix |
| `GET` | `/api/v1/users/me` | Yes | `JwtAuthGuard`, `@CurrentUser()` | 200, 401 | Detailed user profile with full organization tenancy and metadata |

### Interactive Swagger / OpenAPI Documentation:
- Live endpoint explorer available at `/api/docs`.
- Configured with Bearer JWT security scheme under `JWT-auth`.

---

## 7. Database Seed Script (`apps/api/prisma/seed.ts`)

Configured with idempotent upsert operations:
1. **Organization:** `DigiTechzo Media & Technologies Pvt Ltd` (slug: `digitechzo`).
2. **Roles:** `ADMIN`, `MANAGER`, `BDE_SALES`, `MARKETING`, `DELIVERY`.
3. **Permissions:** 22 granular CRM permissions across `users`, `roles`, `audit_logs`, `settings`, `leads`, `deals`, `tasks`, and `reports`.
4. **RolePermission Matrix:** Full administration for `ADMIN`, departmental permissions for `MANAGER`, sales operations for `BDE_SALES`.
5. **Reference Pipeline Stages:** 6 stages with benchmark metrics (`Qualification`, `Discovery`, `Proposal Sent`, `Negotiation`, `Closed Won`, `Closed Lost`).
6. **Reference Lost Reasons:** 5 reasons (`PRICE_TOO_HIGH`, `COMPETITOR_CHOSEN`, `TIMING_POSTPONED`, `POOR_FIT`, `UNRESPONSIVE`).
7. **Initial Administrator User:** Configured with Argon2id hashed credentials from environment variables (`admin@digitechzo.com`).

---

## 8. Automated Test Suite Execution

All unit and integration test suites executed with 100% pass rate:

```
Test Suites: 4 passed, 4 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Time:        18.219 s
Ran all test suites.

PASS apps/api/test/auth.spec.ts
  AuthService (Authentication & Token Rotation)
    Login
      ✓ should authenticate user and return access token, refresh token, and user info
      ✓ should throw UnauthorizedException on wrong password
      ✓ should throw ForbiddenException if user status is INACTIVE
    Refresh Token Rotation & Reuse Detection
      ✓ should rotate valid refresh token into a new token pair and revoke the previous token
      ✓ should detect reuse of revoked token, revoke all user sessions, and throw UnauthorizedException
    Logout
      ✓ should revoke user refresh tokens and log session exit

PASS apps/api/test/rbac.spec.ts
  RBAC & Authorization Guards
    RolesGuard
      ✓ should allow access when no roles are required
      ✓ should allow access when user role is in required roles list
      ✓ should throw ForbiddenException when user lacks the required role
      ✓ should throw ForbiddenException when user has no role defined
    PermissionsGuard
      ✓ should allow access when no permissions are required
      ✓ should allow access when user possesses all required permissions
      ✓ should throw ForbiddenException when user lacks one or more required permissions

PASS apps/api/test/security.spec.ts
  Security & Infrastructure Interceptors
    RequestIdInterceptor
      ✓ should generate a new X-Request-ID if none is provided in headers
      ✓ should respect incoming X-Request-ID header
    TransformResponseInterceptor
      ✓ should wrap plain response objects into standardized envelope
    Cryptographic Token Hashing Safeguards
      ✓ should hash refresh token with SHA-256 producing exact 64-character hex digest

PASS apps/api/test/health.spec.ts
  HealthService
    ✓ should return status "ok" and database "connected" when database responds
    ✓ should return status "degraded" and database "disconnected" when database query fails
```

---

## 9. Verification Sign-Off

1. **Backend TypeScript Typecheck:** `npm run typecheck` in `apps/api` passed with 0 errors.
2. **Backend Compilation / Build:** `npm run build` in `apps/api` passed cleanly generating production artifacts in `apps/api/dist/`.
3. **Prisma Client Generation:** `@prisma/client` generated and validated against PostgreSQL schema.
4. **Frozen Frontend Preservation:** Audit verified **zero changes** to `src/` (all E1–E10 frontend files remain untouched and frozen).
5. **Scope Compliance:** Strict B1 boundary maintained. No CRM domain business modules (Leads, Deals, WhatsApp, Telephony, AI) were implemented.
