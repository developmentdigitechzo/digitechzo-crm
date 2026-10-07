# DigiTechzo CRM — Testing & Quality Assurance Strategy

> **STATUS:** SPECIFICATION / PLANNING  
> **Version:** 1.0.0  
> **Objective:** Establish a comprehensive testing pyramid ensuring zero regression, sub-200ms API response times, and bulletproof RBAC enforcement prior to production release.

---

## 1. Testing Pyramid Overview

```
               /\
              /  \      E2E Tests (Playwright)
             /    \     Critical user journeys (Lead -> Won)
            /------\
           /        \   Integration & API Tests (Supertest + Testcontainers)
          /          \  NestJS Controllers, Repositories, RBAC, DB transactions
         /------------\
        /              \  Unit Tests (Vitest / Jest)
       /                \ Domain services, scoring logic, DTO validation, hooks
      /------------------\
```

---

## 2. Testing Tiers & Frameworks

| Testing Tier | Scope / Objective | Recommended Tooling | Execution Trigger |
| :--- | :--- | :--- | :--- |
| **Unit Testing (Backend)** | Domain services, lead scoring calculation, BANT validation, DTO parsers | Vitest / Jest | On every Git commit / PR |
| **Unit Testing (Frontend)**| Custom React hooks, formatters, schema validation, state reducers | Vitest + React Testing Library | On every Git commit / PR |
| **Component Testing** | UI primitives, Kanban deal cards, BDE task item, forms | React Testing Library + MSW | PR / CI Build |
| **API & Integration Testing**| REST endpoints (`/api/v1/*`), RBAC guards, Prisma queries, DB transactions | Supertest + Testcontainers (PostgreSQL) | Nightly / Pre-merge |
| **End-to-End (E2E) Testing** | Critical full-stack user journeys across browser | Playwright | Pre-release / Staging deployment |
| **Security Testing** | RBAC permission bypass, token rotation tampering, SQLi/XSS fuzzing | OWASP ZAP / Custom Security Suites | Pre-release gate |
| **Performance Testing** | High-concurrency lead ingestion, Kanban query latency under 100k rows | k6 / Artillery | Pre-production baseline |

---

## 3. Mandatory Test Coverage Requirements

### 3.1 Business Logic & Domain Invariants
- **Next Action Invariant:** Verify that a lead cannot be saved or moved without a scheduled next action.
- **Lead Assignment:** Test Round-Robin distribution equity and fallback assignment logic.
- **Lead Scoring:** Validate accurate calculation of `Hot`, `Warm`, and `Cold` status scores based on BANT answers.
- **Stage Movement & Lost Reason:** Verify that dragging a deal to `Closed-Lost` throws an error if `lostReasonId` is missing.
- **Stage Movement & Won Validation:** Verify that marking a deal `Closed-Won` converts the lead to a customer and requires advance payment fields.

### 3.2 Security & RBAC Scoping Tests
- **Owner Isolation:** Verify that a BDE cannot access or edit another BDE's lead record via direct API calls (`403 Forbidden`).
- **Manager Team Scoping:** Verify that a Sales Manager can only query leads within their assigned team members.
- **Admin Privileges:** Verify that only `ADMIN` roles can invite users, modify pipeline stages, or export lead databases.
- **Token Rotation & Revocation:** Verify that reusing an invalidated refresh token revokes all active session tokens immediately.

### 3.3 Webhook Ingestion & Deduplication Tests
- **Meta Ads Webhook:** Test valid HMAC signature acceptance, invalid signature rejection (`401 Unauthorized`), and field mapping.
- **Duplicate Detection:** Ingesting a webhook with an existing phone/email must append an interaction to the existing lead rather than creating a duplicate.

---

## 4. Production Release Quality Gates

Before any production deployment is authorized, the following gates must pass:
1. **100% Pass Rate** on all Unit, Integration, and E2E test suites.
2. **Code Coverage:** Minimum 85% line coverage on core backend domain services and 75% on frontend feature logic.
3. **Performance Gate:** $p95$ API response time $< 200\text{ms}$ under 50 concurrent simulated users.
4. **Security Scan:** Zero High or Critical severity vulnerabilities detected by `npm audit` or automated SAST scans.
