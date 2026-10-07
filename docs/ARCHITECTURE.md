# DigiTechzo CRM — Target System Architecture & Topology

> **STATUS:** SPECIFICATION / PLANNING  
> **Architecture Classification:** **TARGET ARCHITECTURE / PROPOSED ARCHITECTURE**  
> **Phase:** Phase 0 — Blueprint & Architecture Specification  
> **Note:** This document defines the target architectural model and layer boundaries. No implementation or code execution has occurred.

---

## 1. High-Level Target Architectural Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 PROPOSED PRESENTATION LAYER (SPA)                           │
│                                                                             │
│   React SPA (Vite + TypeScript + Tailwind CSS + shadcn/ui + dnd-kit)        │
│   ┌────────────────────────┬─────────────────────────┬──────────────────┐   │
│   │   BDE Daily Queue UI   │  Kanban Pipeline Board  │  Lead Detail UI  │   │
│   └────────────────────────┴─────────────────────────┴──────────────────┘   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │           TanStack Query (Server State Cache & Optimistic UI)       │   │
│   └───────────────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────────────────┼─────────────────────────────────────┘
                                        │ HTTPS / JSON REST API
                                        │ Route Prefix: /api/v1
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 PROPOSED APPLICATION / API LAYER                            │
│                                                                             │
│   NestJS Modular Monolith                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │     Global Guards (JWT AuthGuard, RolesGuard, TenantScopeGuard)     │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │     Global Interceptors & Pipes (ValidationPipe, AuditInterceptor)  │   │
│   └───────────────────────────────────┬─────────────────────────────────┘   │
│                                       ▼                                     │
│   ┌──────────────┬──────────────┬──────────────┬─────────────┬──────────┐   │
│   │ LeadsModule  │ DealsModule  │ TasksModule  │ CommModule  │AuthModule│   │
│   └──────┬───────┴──────┬───────┴──────┬───────┴──────┬──────┴─────┬────┘   │
│          │              │              │              │            │        │
│          ▼              ▼              ▼              ▼            ▼        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │             Domain Services & Business Logic Handlers               │   │
│   └───────────────────┬───────────────────────────────┬─────────────────┘   │
└───────────────────────┼───────────────────────────────┼─────────────────────┘
                        │ Repository Pattern            │ Provider Adapters
                        ▼                               ▼
┌────────────────────────────────────────┐  ┌─────────────────────────────────┐
│      PROPOSED PERSISTENCE LAYER        │  │   PROPOSED INTEGRATION LAYER    │
│                                        │  │                                 │
│   Prisma ORM Client                    │  │   Provider-Agnostic Adapters:   │
│   ┌────────────────────────────────┐   │  │   • TelephonyAdapter (TBD)      │
│   │ LeadPrismaRepository           │   │  │   • MessagingAdapter (TBD)      │
│   │ DealPrismaRepository           │   │  │   • StorageAdapter (TBD)        │
│   │ TaskPrismaRepository           │   │  │   • SttAdapter (TBD)            │
│   │ UserPrismaRepository           │   │  │   • LlmAdapter (TBD)            │
│   └───────────────┬────────────────┘   │  └────────────────┬────────────────┘
│                   ▼                    │                   │
│         PostgreSQL Database            │                   ▼
│   (Relational Tables, Indices, JSONB)  │  ┌─────────────────────────────────┐
└────────────────────────────────────────┘  │ External Service Providers(TBD) │
                                            │ (Research options: Meta, Tel,AI)│
                                            └─────────────────────────────────┘
```

---

## 2. Core Architectural Principles (Target Model)

### 2.1 Clean Separation of Concerns
1. **Presentation Layer (Frontend SPA):** Responsible exclusively for user interactions, optimistic UI transitions, client-side validation, and localized state. The frontend communicates with the backend solely via the `/api/v1` REST contract.
2. **Application Layer (NestJS Modular Monolith):** Houses domain models, business rule validation, transaction orchestration, RBAC security, and event dispatches. Controllers receive requests, validate DTOs via class-validator, and invoke domain services.
3. **Persistence Layer (Repository Pattern):** Domain services never call the database driver or Prisma client directly. Instead, they interact with clean domain interfaces (e.g., `ILeadRepository`). Concrete Prisma repositories implement these interfaces, isolating database-specific logic.
4. **Integration Layer (Provider Adapters):** All external third-party services (Telephony carriers, WhatsApp business API, Cloud object storage, Speech-to-Text, AI inference endpoints) are wrapped behind adapter interfaces. This ensures the core CRM business logic remains 100% vendor-neutral.

---

## 3. Key Operational Capabilities

### 3.1 Multi-Team & Multi-User Architecture
- System models the DigiTechzo organization with hierarchical teams (e.g., Inbound Sales Team, Outbound Enterprise Team, Digital Marketing, Customer Delivery).
- Data scoping ensures reps see their assigned workload while managers gain consolidated team visibility.

### 3.2 Multi-Number & Multi-Provider Telephony Architecture
- The system supports associating multiple virtual phone numbers with specific teams or lead sources.
- The `TelephonyAdapter` abstracts carrier differences, enabling DigiTechzo to switch or combine telephony providers without rewriting call logging logic.

### 3.3 Decoupled Frontend Mocking Strategy
- The React frontend application is architected to operate against a strongly-typed Mock Service Worker (MSW) or in-memory API client.
- This allows complete UI/UX building, validation, and user testing of complex screens (Kanban boards, BDE daily queue, qualification modals) before backend API endpoints are deployed.

---

## 4. Cross-Cutting Standards (Proposed)

| Concern | Architectural Implementation |
| :--- | :--- |
| **Authentication** | Stateless JWT access tokens + server-side hashed refresh tokens stored in database. |
| **Authorization** | Declarative NestJS `@Roles()` and `@Permissions()` decorators evaluated via `RolesGuard` and `TenantScopeGuard`. |
| **Audit Logging** | Global `AuditLogInterceptor` recording actor ID, IP address, user agent, target entity, action (`CREATE`, `UPDATE`, `DELETE`, `REASSIGN`), and before/after diffs. |
| **Error Handling** | Standardized `HttpExceptionFilter` guaranteeing uniform error envelopes (`statusCode`, `message`, `errorCode`, `timestamp`, `details`). |
| **Configuration** | Centralized `@nestjs/config` validation using Joi / Zod environment schemas. Zero hardcoded secrets. |
| **Database Migrations**| Version-controlled Prisma migration scripts executed automatically in deployment pipelines. |
