# DigiTechzo CRM — Backend Architecture Specification

> **STATUS:** SPECIFICATION / PLANNING  
> **Architecture Classification:** **TARGET ARCHITECTURE / PROPOSED ARCHITECTURE**  
> **Proposed Stack:** NestJS + TypeScript + Prisma + PostgreSQL  
> **Phase:** Phase 0 — Documentation / Planning (Zero backend code initialized)

---

## 1. Proposed Modular Monolith Architecture

The proposed backend is structured as an enterprise-grade **NestJS Modular Monolith**. Each business capability is encapsulated within a self-contained feature module with strict boundaries.

```
backend/
├── src/
│   ├── main.ts                       # Application bootstrap & global pipes
│   ├── app.module.ts                 # Root module assembling all feature modules
│   │
│   ├── common/                       # Shared cross-cutting infrastructure
│   │   ├── constants/                # Global enums, tokens, regex
│   │   ├── decorators/               # @CurrentUser(), @Roles(), @Permissions()
│   │   ├── dto/                      # PaginationDto, ApiResponseDto, ErrorResponseDto
│   │   ├── filters/                  # Global HttpExceptionFilter
│   │   ├── guards/                   # JwtAuthGuard, RolesGuard, TenantScopeGuard
│   │   ├── interceptors/             # AuditLogInterceptor, TransformResponseInterceptor
│   │   ├── pipes/                    # ZodValidationPipe / ClassValidationPipe
│   │   └── utils/                    # Hash utilities (Argon2), phone normalizers
│   │
│   ├── config/                       # Central configuration & env validation
│   │   ├── app.config.ts
│   │   ├── auth.config.ts
│   │   ├── database.config.ts
│   │   └── env.validation.ts         # Joi/Zod schema for environment variables
│   │
│   ├── core/                         # Core domain interfaces & base repository
│   │   ├── domain/                   # Pure business entities & value objects
│   │   ├── repositories/             # ILeadRepository, IDealRepository, ITaskRepository
│   │   └── adapters/                 # ITelephonyAdapter, IMessagingAdapter, IStorageAdapter
│   │
│   ├── infrastructure/               # Concrete implementations of core interfaces
│   │   ├── prisma/                   # PrismaClient service & migration helpers
│   │   ├── repositories/             # LeadPrismaRepository, DealPrismaRepository
│   │   ├── storage/                  # LocalDiskStorageAdapter, S3StorageAdapter
│   │   ├── telephony/                # MockTelephonyAdapter, ProviderTelephonyAdapter (TBD)
│   │   ├── messaging/                # MockMessagingAdapter, WhatsAppMessagingAdapter (TBD)
│   │   └── ai/                       # MockLlmAdapter, ProviderLlmAdapter (TBD)
│   │
│   └── modules/                      # Business Feature Modules
│       ├── auth/                     # AuthController, AuthService, JwtStrategy
│       ├── users/                    # UsersController, UsersService
│       ├── teams/                    # TeamsController, TeamsService
│       ├── leads/                    # LeadsController, LeadsService, IngestController
│       ├── qualification/            # QualificationController, QualificationService
│       ├── pipeline/                 # DealsController, StagesController
│       ├── tasks/                    # TasksController, FollowUpSchedulerService
│       ├── communication/            # CommController, TimelineService
│       ├── proposals/                # ProposalsController, ProposalsService
│       ├── customers/                # CustomersController, CustomersService
│       ├── analytics/                # AnalyticsController, DashboardAggregationService
│       └── audit/                    # AuditLogController, AuditLogService
```

---

## 2. Layered Module Anatomy (Target Pattern)

Every feature module follows a strict 4-layer internal separation:

```
[ HTTP Controller ] (Handles HTTP request, route, auth guards, parses DTO)
         │
         ▼
[ Domain Service ]  (Implements business rules, orchestrates transactions, emits events)
         │
         ▼
[ Repository Interface ] (Abstract contract: ILeadRepository)
         │
         ▼
[ Prisma Repository ] (Concrete SQL/Prisma implementation)
         │
         ▼
[ PostgreSQL Database ]
```

### 2.1 Repository Interface vs Implementation Pattern (Proposed)
Domain services never couple directly to the ORM:

```typescript
// Proposed Domain Interface: src/core/repositories/lead.repository.interface.ts
export interface ILeadRepository {
  findById(id: string): Promise<Lead | null>;
  findByPhoneNormalized(phone: string): Promise<Lead | null>;
  findMany(filters: LeadQueryFilters, pagination: PaginationParams): Promise<PaginatedResult<Lead>>;
  create(data: CreateLeadDomainDto): Promise<Lead>;
  update(id: string, data: UpdateLeadDomainDto): Promise<Lead>;
  updateOwner(id: string, newOwnerId: string): Promise<Lead>;
  softDelete(id: string, deletedByUserId: string): Promise<void>;
}
```

---

## 3. Cross-Cutting Backend Standards (Proposed)

### 3.1 Validation & Data Transfer Objects (DTOs)
- All inbound requests must be strictly validated using DTOs backed by `class-validator` / `class-transformer` or Zod.
- Unrecognized properties are stripped automatically (`whitelist: true`, `forbidNonWhitelisted: true`).

### 3.2 Global Error Envelope
All error responses strictly follow the RFC 7807 Problem Details structure:

```json
{
  "statusCode": 400,
  "errorCode": "VALIDATION_FAILED",
  "message": "Invalid request payload",
  "timestamp": "2026-10-05T18:30:00.000Z",
  "path": "/api/v1/leads",
  "errors": [
    { "field": "primaryPhone", "message": "Phone must be in valid E.164 format" }
  ]
}
```

### 3.3 Audit Logging & Change Tracking
- The `AuditLogInterceptor` captures every state-mutating operation (`POST`, `PUT`, `PATCH`, `DELETE`).
- Audit entries record: `actorUserId`, `ipAddress`, `userAgent`, `entityName`, `entityId`, `action`, `previousState`, `newState`, and `timestamp`.

### 3.4 Logging Infrastructure
- Uses Winston or Pino for structured JSON logging.
- Every incoming HTTP request is assigned a unique `x-request-id` (UUIDv4) that propagates across all service logs, database queries, and external adapter invocations.
