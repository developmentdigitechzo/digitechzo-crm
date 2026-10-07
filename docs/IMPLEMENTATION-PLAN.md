# DigiTechzo CRM — Phased Implementation Plan & Roadmap

> **STATUS:** SPECIFICATION / PLANNING  
> **Architecture Classification:** **PROPOSED IMPLEMENTATION ROADMAP**  
> **Phase:** Phase 0 — Documentation / Planning  
> **Rule:** No implementation is executed without formal phase sign-off. Zero application source code exists.

---

## Roadmap Overview

```
[ Phase 0: Documentation & Architecture ] ◄── (CURRENT PHASE)
                   │
                   ▼
[ Phase 1: Frontend Foundation (Vite + React + Tailwind + shadcn) ]
                   │
                   ▼
[ Phase 2: Frontend CRM Modules & Mock Workflows ]
                   │
                   ▼
[ Phase 3: Backend Foundation (NestJS Modular Monolith) ]
                   │
                   ▼
[ Phase 4: Backend API Implementation (Controllers + DTOs) ]
                   │
                   ▼
[ Phase 5: Database & Persistence Layer (PostgreSQL + Prisma) ]
                   │
                   ▼
[ Phase 6: Frontend / Backend Integration & RBAC Wiring ]
                   │
                   ▼
[ Phase 7: WhatsApp & Inbound Lead Ingestion (MessagingAdapter) ]
                   │
                   ▼
[ Phase 8: Cloud Telephony & Recording (TelephonyAdapter) ]
                   │
                   ▼
[ Phase 9: Speech-to-Text & AI Sales Assistant (SttAdapter / LlmAdapter) ]
                   │
                   ▼
[ Phase 10: Security Hardening, E2E Testing & Production Deployment ]
```

---

## Detailed Phase Breakdown

### Phase 0: Documentation, Requirements & Git Setup (CURRENT)
* **Objective:** Establish 100% comprehensive documentation, technology recommendations, entity models, API contracts, and user flows.
* **Scope:** 22 Markdown documentation files in `docs/` covering all architectural layers.
* **Dependencies:** None.
* **Deliverables:** Complete `docs/` directory with verified cross-references.
* **Acceptance Criteria:** All documentation files created without application source code.
* **Deferred:** All package installations, code initialization, and database creation.

---

### Phase 1: Frontend Foundation & UI Shell
* **Objective:** Scaffold the proposed React Single Page Application with styling, layout components, and design system primitives.
* **Scope:** Vite initialization, TypeScript configuration, Tailwind CSS, shadcn/ui base setup, React Router shell, AuthLayout, DashboardLayout, and dark/light theme support.
* **Dependencies:** Phase 0 owner sign-off.
* **Deliverables:** Working responsive frontend shell with navigation bar, collapsible sidebar, and route placeholders.
* **Acceptance Criteria:** UI shell boots cleanly on `localhost:5173`, responsive across mobile/desktop, zero console errors.
* **Deferred:** Backend API connectivity, real authentication.

---

### Phase 2: Frontend CRM Modules & Mock Workflows
* **Objective:** Build all core CRM screens using Mock Service Worker (MSW) and strongly typed mock seed data.
* **Scope:**
  - Lead table with search, filters, pagination, and import modal.
  - Lead 360 Detail View with Qualification Drawer, Timeline stream, and Next Action banner.
  - Drag-and-drop Kanban Pipeline Board (`@dnd-kit`) with Lost Reason and Won modals.
  - BDE Daily Work Dashboard (Overdue, Pending Calls, Today's Demos).
  - Executive Management Dashboard charts.
* **Dependencies:** Phase 1.
* **Deliverables:** Fully interactive, clickable CRM frontend running on mock data.
* **Acceptance Criteria:** BDE daily queue, Kanban drag-and-drop, and qualification flows are 100% testable by stakeholders in browser.
* **Deferred:** Real backend database persistence.

---

### Phase 3: Backend Architecture & Core Foundation
* **Objective:** Scaffold the NestJS modular monolith with standard cross-cutting infrastructure.
* **Scope:** NestJS app bootstrap, configuration module (`@nestjs/config`), environment validation, global exception filters, standard response envelopes, Winston structured logger, and JWT authentication guards.
* **Dependencies:** Phase 0 owner sign-off.
* **Deliverables:** Bootable NestJS backend on `localhost:3000` with `/api/v1/health` and auth scaffolding.
* **Acceptance Criteria:** Clean modular structure with strict separation of `controllers`, `services`, `repositories`, and `adapters`.
* **Deferred:** External third-party carrier integrations.

---

### Phase 4: Backend API Contract Implementation
* **Objective:** Implement all REST endpoints defined in `API.md` with strict DTO validation.
* **Scope:** Controllers, services, and in-memory/stub repository implementations for Leads, Deals, Tasks, Activities, Meetings, Proposals, and Analytics.
* **Dependencies:** Phase 3.
* **Deliverables:** Functional REST API fulfilling all `/api/v1/*` contracts with Swagger/OpenAPI documentation.
* **Acceptance Criteria:** Supertest unit/integration tests validate all request DTO validations and error responses.
* **Deferred:** Live PostgreSQL database connection (uses mock repository layer).

---

### Phase 5: Database Schema & Persistence Layer
* **Objective:** Implement the PostgreSQL relational schema and Prisma repository layer.
* **Scope:** Prisma schema definition matching `DATA-MODEL.md`, initial database migrations, repository pattern implementations (`LeadPrismaRepository`, `DealPrismaRepository`, `TaskPrismaRepository`), and seed scripts.
* **Dependencies:** Phase 4.
* **Deliverables:** PostgreSQL schema, migration history, and concrete Prisma repositories.
* **Acceptance Criteria:** Database migrations apply cleanly; relational foreign keys, unique constraints, and cascade rules function as specified.
* **Deferred:** Real cloud production DB setup (local PostgreSQL used).

---

### Phase 6: Frontend / Backend Integration & RBAC
* **Objective:** Connect the React frontend to the live NestJS backend and enforce RBAC.
* **Scope:** Replace MSW handlers with live TanStack Query API client calls, wire up real JWT login with rotating refresh token cookies, enforce role-based UI visibility and server-side scoping.
* **Dependencies:** Phase 2, Phase 5.
* **Deliverables:** End-to-end operational CRM platform with live database persistence.
* **Acceptance Criteria:** Reps and managers can log in, create leads, update pipeline stages, and manage daily follow-up queues with real-time DB persistence.
* **Deferred:** WhatsApp API, Telephony carrier integration.

---

### Phase 7: WhatsApp & Inbound Lead Ingestion
* **Objective:** Connect external lead capture sources and WhatsApp messaging via `MessagingAdapter`.
* **Scope:** Meta Lead Ads webhook ingestion, Google Ads / Website form public ingestion API, `MessagingAdapter` implementation for WhatsApp (provider selected from research candidates), template messaging, and two-way timeline sync.
* **Dependencies:** Phase 6, WhatsApp Provider selection.
* **Deliverables:** Automated lead ingestion from Meta Ads and operational WhatsApp messaging.
* **Acceptance Criteria:** Submitting a Meta Lead Ad test lead creates an active CRM lead and sends a WhatsApp welcome message.
* **Deferred:** Voice telephony calls.

---

### Phase 8: Cloud Telephony & Call Recording
* **Objective:** Implement voice call capabilities, click-to-call, and call recording storage via `TelephonyAdapter`.
* **Scope:** `TelephonyAdapter` implementation (provider selected from research candidates), click-to-call bridging, inbound caller matching, CDR webhook ingestion, and call recording audio storage via `StorageAdapter`.
* **Dependencies:** Phase 6, Telephony Provider selection.
* **Deliverables:** Working click-to-call from lead view and automated call recording playback in timeline.
* **Acceptance Criteria:** Inbound call from unknown number auto-creates a lead; call recording plays in timeline.
* **Deferred:** AI transcription of calls.

---

### Phase 9: Speech-to-Text & AI Sales Assistant (P2)
* **Objective:** Implement conversational intelligence, call transcription, and structured extraction via `SttAdapter` and `LlmAdapter`.
* **Scope:** `SttAdapter` audio transcription pipeline, `LlmAdapter` structured extraction (BANT, budget, timeline, objections, questions), fact vs. inference separation, and BDE coaching suggestions.
* **Dependencies:** Phase 8, LLM/STT Provider and model selection.
* **Deliverables:** Automated AI call summary and qualification assistant cards in activity feed.
* **Acceptance Criteria:** Uploading/receiving a call recording extracts verified facts and populates suggested next actions without hallucinating unmentioned data.
* **Deferred:** Autonomous outbound voice calling agents.

---

### Phase 10: Security Hardening, E2E Testing & Production Deployment
* **Objective:** Execute production deployment, infrastructure provisioning, and final security audit.
* **Scope:** Full Playwright E2E test suite, performance stress testing, security audit, CI/CD pipeline setup, production PostgreSQL setup, SSL/DNS configuration, and production launch.
* **Dependencies:** Phases 1–9.
* **Deliverables:** Fully deployed, monitored, production-ready DigiTechzo CRM.
* **Acceptance Criteria:** 100% test pass rate, sub-200ms latency, zero high-severity security issues, automated backups active.
