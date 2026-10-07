# DigiTechzo CRM

> **STATUS: DOCUMENTATION / PLANNING**  
> **Phase:** Phase 0 — Blueprint & Architecture Specification  
> **Implementation Status:** No implementation has been approved or executed yet. Zero application source code exists.  
> **Current Activity:** Formal documentation and technical baseline establishment only.

---

## 1. Project Overview

**Project Name:** DigiTechzo CRM  
**Organization:** DigiTechzo  
**Core Purpose:** Empower DigiTechzo sales, marketing, and business growth operations with an action-driven, multi-channel customer relationship management platform.

### CRM Objective
The DigiTechzo CRM is explicitly designed **not merely as a passive storage database for leads**, but as an **operational sales engine**. Its fundamental objective is to eliminate lead leakage and enforce sales velocity by ensuring every sales representative (BDE) and manager knows:
1. **Who to contact** (Prioritized lead queues, hot leads, inbound prospects).
2. **When to contact them** (Automated follow-up scheduling, SLA reminders, overdue alerts).
3. **What action to take** (Calls, WhatsApp follow-ups, demos, proposal dispatch, contract negotiation).
4. **What happened after the interaction** (Call outcome tracking, notes, qualification updates, stage transitions, timeline logging).

---

## 2. Problems the System Solves

1. **Lead Inaction & Leakage:** Prevents inbound leads from Meta Ads, Google Ads, website forms, and WhatsApp from getting lost or left without follow-up through mandatory ownership and strict "Next Action" enforcement.
2. **Unstructured Lead Qualification:** Standardizes qualification metrics (Budget, Authority, Need, Timeline - BANT) with mandatory fields and scoring.
3. **Lack of Pipeline Visibility:** Replaces fragmented spreadsheets with a visual, drag-and-drop sales pipeline, real-time stage progression, deal valuation, and closing date forecasts.
4. **Missed Follow-Ups:** Eliminates forgotten customer touches through BDE daily work queues and automated overdue alerts.
5. **Scattered Multi-Channel History:** Consolidates telephony call records, WhatsApp chats, email exchanges, meeting notes, and proposal revisions into a single chronological timeline per lead.
6. **Management Blindspots:** Delivers actionable dashboards covering conversion funnel metrics, lead velocity, campaign ROI, and rep performance.

---

## 3. Core Workflow Summary

```
Lead Capture (Meta, Google, Web, WhatsApp, Manual/Import)
       │
       ▼
   New Lead (Contact & Source Information Capture)
       │
       ▼
 Qualification (BANT, Service Interest, Hot/Warm/Cold Scoring)
       │
       ▼
  Assignment (Auto / Manual Distribution to BDE)
       │
       ▼
 First Contact (Call / Message Attempt & Outcome Logging)
       │
       ▼
   Follow-up (Mandatory Next Action with Date/Time/Owner)
       │
       ▼
Meeting / Demo (Booking, Reminders, Attendance, Outcome)
       │
       ▼
    Proposal (Quotation Creation, Commercial Revisions)
       │
       ▼
  Negotiation (Commercial Discussions & Objections)
       │
       ▼
   Won / Lost (Deal Closing, Payment Recording / Mandatory Loss Reason)
       │
       ├─────────────────────────┐
       ▼                         ▼
   Onboarding                Retention (Renewals, Upsell, Cross-sell)
```

---

## 4. Proposed High-Level Architecture Overview (TARGET ARCHITECTURE)

```
┌─────────────────────────────────────────────────────────┐
│     Proposed Frontend: React SPA (Vite + TypeScript)    │
│  (Tailwind CSS, shadcn/ui, TanStack Query, dnd-kit)     │
└────────────────────────────┬────────────────────────────┘
                             │ HTTPS / REST JSON (/api/v1)
                             ▼
┌─────────────────────────────────────────────────────────┐
│           Proposed Backend: NestJS Modular Monolith     │
│   (Controllers, Services, RBAC Guards, Audit Log)       │
├────────────────────────────┬────────────────────────────┤
│   Domain & Repository      │      Provider Adapters     │
│   Interfaces               │  (Telephony, WhatsApp,     │
│   (Lead, Deal, Task, Auth) │   Storage, STT, LLM)       │
└─────────────┬──────────────┴──────────────┬─────────────┘
              │ Prisma Client (Proposed)    │ External APIs
              ▼                             ▼
┌──────────────────────────┐  ┌───────────────────────────┐
│  PostgreSQL (Proposed)   │  │ External Providers (TBD)  │
│  (Relational Storage)    │  │ (Meta, WhatsApp, Tel, AI) │
└──────────────────────────┘  └───────────────────────────┘
```

---

## 5. Implementation Philosophy

1. **Activity-Driven Design:** Every lead must always have an active owner and a mandatory scheduled "Next Action".
2. **Provider-Agnostic Core:** All third-party services (Telephony, WhatsApp, Cloud Storage, Speech-to-Text, Large Language Models) are abstracted behind strict Adapter interfaces. No provider lock-in exists inside domain logic.
3. **Decoupled Development:** The frontend SPA is fully decoupled from the backend and can run against strongly typed mock contracts during early UI validation.
4. **Zero Unapproved Implementations:** Architecture, database schemas, and external integrations strictly follow documented specifications without ad-hoc structural drift.

---

## 6. Complete Documentation Index (22 Documents)

| Document | Purpose |
| :--- | :--- |
| [README.md](file:///c:/DigiTechzo%20CRM/docs/README.md) | Project overview, objectives, high-level proposed architecture, index, and status |
| [REQUIREMENTS.md](file:///c:/DigiTechzo%20CRM/docs/REQUIREMENTS.md) | Exhaustive functional & non-functional requirements specification |
| [MVP-SCOPE.md](file:///c:/DigiTechzo%20CRM/docs/MVP-SCOPE.md) | Phase breakdown (P0 MVP, P1 Core Enhancements, P2 Automation/AI) & deferred features |
| [USER-FLOWS.md](file:///c:/DigiTechzo%20CRM/docs/USER-FLOWS.md) | End-to-end user workflows and state transitions |
| [CRM-MODULES.md](file:///c:/DigiTechzo%20CRM/docs/CRM-MODULES.md) | Detailed module specifications, screens, actions, and data models |
| [BUSINESS-RULES.md](file:///c:/DigiTechzo%20CRM/docs/BUSINESS-RULES.md) | Operational rules, invariants, and enforcement policies |
| [TECHNOLOGY-DECISIONS.md](file:///c:/DigiTechzo%20CRM/docs/TECHNOLOGY-DECISIONS.md) | Evaluated tech stack, explicit status classifications, and pending approvals |
| [ARCHITECTURE.md](file:///c:/DigiTechzo%20CRM/docs/ARCHITECTURE.md) | Target system architecture blueprint, patterns, and boundaries |
| [FRONTEND-ARCHITECTURE.md](file:///c:/DigiTechzo%20CRM/docs/FRONTEND-ARCHITECTURE.md) | Proposed React application structure, state, UI kit, routing, and mock strategy |
| [BACKEND-ARCHITECTURE.md](file:///c:/DigiTechzo%20CRM/docs/BACKEND-ARCHITECTURE.md) | Proposed NestJS modular monolith design, repository pattern, error handling, and adapters |
| [DATA-MODEL.md](file:///c:/DigiTechzo%20CRM/docs/DATA-MODEL.md) | Proposed entity specifications, relational schemas, enums, and data invariants |
| [API.md](file:///c:/DigiTechzo%20CRM/docs/API.md) | REST API `/api/v1` endpoint contracts, request/response payloads, and error codes |
| [AUTH-RBAC.md](file:///c:/DigiTechzo%20CRM/docs/AUTH-RBAC.md) | Proposed authentication mechanics, token rotation, permissions matrix, and scoping |
| [INTEGRATIONS.md](file:///c:/DigiTechzo%20CRM/docs/INTEGRATIONS.md) | Third-party integrations matrix and provider candidate options |
| [PHONE-TELEPHONY.md](file:///c:/DigiTechzo%20CRM/docs/PHONE-TELEPHONY.md) | Inbound/outbound telephony architecture, caller matching, and provider research options |
| [WHATSAPP.md](file:///c:/DigiTechzo%20CRM/docs/WHATSAPP.md) | WhatsApp messaging engine, webhook ingestion, template messaging, and provider research options |
| [AI.md](file:///c:/DigiTechzo%20CRM/docs/AI.md) | Model-neutral AI assistant architecture, structured extraction, call summaries, and coaching |
| [DEPLOYMENT.md](file:///c:/DigiTechzo%20CRM/docs/DEPLOYMENT.md) | Local and production deployment topologies, environments, and hosting research options |
| [SECURITY.md](file:///c:/DigiTechzo%20CRM/docs/SECURITY.md) | Security standards, data encryption, XSS/CSRF mitigations, and compliance rules |
| [TESTING.md](file:///c:/DigiTechzo%20CRM/docs/TESTING.md) | Quality assurance blueprint, test tiers, mock setups, and CI gates |
| [IMPLEMENTATION-PLAN.md](file:///c:/DigiTechzo%20CRM/docs/IMPLEMENTATION-PLAN.md) | Phased execution roadmap (Phases 0 through 10) with milestones and deliverables |
| [OPEN-QUESTIONS.md](file:///c:/DigiTechzo%20CRM/docs/OPEN-QUESTIONS.md) | Unresolved architectural, provider, and operational decisions requiring owner review |
