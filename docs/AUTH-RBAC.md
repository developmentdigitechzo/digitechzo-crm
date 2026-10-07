# DigiTechzo CRM — Authentication & RBAC Specification

> **STATUS:** SPECIFICATION / PLANNING  
> **Architecture Classification:** **TARGET AUTHENTICATION & RBAC MODEL**  
> **Proposed Stack:** JWT Access Tokens + Rotating Refresh Tokens + Argon2id Hashing + Declarative RBAC  
> **Phase:** Phase 0 — Documentation / Planning

---

## 1. Proposed Authentication Lifecycle & Mechanics

```
┌──────────┐                               ┌─────────────┐                      ┌────────────┐
│  Client  │                               │ NestJS Auth │                      │ PostgreSQL │
└────┬─────┘                               └──────┬──────┘                      └─────┬──────┘
     │                                            │                                   │
     │ 1. POST /api/v1/auth/login                 │                                   │
     │    (email, password)                       │                                   │
     ├───────────────────────────────────────────►│                                   │
     │                                            │ 2. Find User by Email             │
     │                                            ├──────────────────────────────────►│
     │                                            │ 3. Verify Argon2id Hash           │
     │                                            │◄──────────────────────────────────┤
     │                                            │                                   │
     │                                            │ 4. Generate Access Token (15m)    │
     │                                            │    Generate Refresh Token (7d)    │
     │                                            │ 5. Store Hashed Refresh Token     │
     │                                            ├──────────────────────────────────►│
     │ 6. Return Access Token in JSON Body +      │                                   │
     │    Set HTTP-Only Secure Refresh Cookie     │                                   │
     │◄───────────────────────────────────────────┤                                   │
     │                                            │                                   │
     │ 7. Authenticated Request                   │                                   │
     │    Authorization: Bearer <access_token>    │                                   │
     ├───────────────────────────────────────────►│ 8. Validate JWT & Extract User    │
     │                                            │                                   │
     │ 9. POST /api/v1/auth/refresh (Cookie)      │                                   │
     ├───────────────────────────────────────────►│ 10. Validate & Rotate Token       │
     │                                            │     (Revoke old, issue new pair)  │
     │ 11. Return New Access Token + New Cookie   │                                   │
     │◄───────────────────────────────────────────┤                                   │
```

### 1.1 Access Token Details (Proposed)
* **Format:** JSON Web Token (JWT), signed with `RS256` or `HS256` (256-bit secret).
* **Payload Claims:**
  - `sub`: User ID (UUID)
  - `orgId`: Organization ID
  - `email`: User Email
  - `role`: System Role (`ADMIN`, `SALES_MANAGER`, `BDE`, etc.)
  - `teamId`: Primary Team ID
  - `exp`: 15 minutes from issue
  - `iat`: Issue timestamp
* **Transmission:** In the `Authorization: Bearer <token>` header for all API interactions.

### 1.2 Refresh Token Details & Rotation Security (Proposed)
* **Format:** Cryptographically secure high-entropy random string (256-bit).
* **Storage in DB:** SHA-256 hash stored in `user_refresh_tokens` table alongside client metadata (IP, user agent, expiration date).
* **Client Storage:** Transmitted strictly in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie (`__Host-refreshToken`).
* **Rotation Policy:** Every call to `/api/v1/auth/refresh` invalidates the presented refresh token and issues a completely new access/refresh pair.
* **Reuse Detection:** If an already-invalidated refresh token is presented, the system treats it as a token theft attempt, automatically invalidating all active refresh tokens for that user account and flagging a security alert.

### 1.3 Password Hashing Standards (Proposed)
* **Algorithm:** Argon2id.
* **Configuration:**
  - Memory cost: 65,536 KB (64 MB)
  - Time cost (iterations): 3
  - Parallelism: 4 threads
* Salts are cryptographically randomized per user.

---

## 2. Role-Based Access Control (RBAC) Matrix

### 2.1 Standard System Roles
1. **Super Admin / Admin:** Complete organizational control, user administration, system settings, audit logs, and global reporting.
2. **Sales Manager:** Supervisory visibility over sales teams, pipeline performance, lead assignment, and discount approvals.
3. **BDE / Sales Executive:** Operational sales reps managing assigned leads, daily follow-up queues, demo logging, and deal advancement.
4. **Marketing Executive:** Campaign tracking, lead capture source monitoring, and ingestion logs.
5. **Delivery / Account Manager:** Post-sale onboarding, project handoff, customer profiles, and service renewal tracking.

### 2.2 Permissions Matrix

| Resource / Capability | Super Admin | Sales Manager | BDE / Sales Rep | Marketing | Delivery / AM |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Manage Users & Teams** | Full | Read Only | None | None | None |
| **View Leads** | All Org Leads | Team Leads | Assigned Leads | All Inbound | Won Leads Only |
| **Create / Ingest Leads** | Yes | Yes | Yes | Yes (Ingest) | None |
| **Edit Lead Contact Info** | Yes | Team Leads | Assigned Leads | None | None |
| **Reassign Lead Owner** | Yes | Team Leads | None | None | None |
| **Delete / Soft-Delete Lead**| Yes | None | None | None | None |
| **Export Leads (CSV)** | Yes | Yes | Restricted | None | None |
| **View Sales Pipeline** | All Deals | Team Deals | Assigned Deals | None | Won Deals |
| **Move Kanban Stages** | Yes | Team Deals | Assigned Deals | None | None |
| **Set Closed-Lost Reason** | Yes | Yes | Yes | None | None |
| **Approve Discounts / Terms**| Yes | Yes | None | None | None |
| **View Management Reports** | Full Org | Team Funnel | Personal Queue | Source ROI | Delivery Reports |
| **Access Audit Logs** | Yes | None | None | None | None |

---

## 3. Data Scoping Implementation (Proposed)

NestJS guards enforce multi-tier data scoping at the controller and repository layer:
- **Global Scope (`Admin`):** `WHERE organizationId = :orgId`
- **Team Scope (`Sales Manager`):** `WHERE organizationId = :orgId AND owner.teamId = :managerTeamId`
- **Owner Scope (`BDE`):** `WHERE organizationId = :orgId AND ownerId = :currentUserId`

---

## 4. Rate Limiting & Brute Force Protection (Proposed)

1. **Login Endpoint Protection:**
   - Maximum 5 failed login attempts per IP / Account within 15 minutes.
   - Upon threshold breach, account is temporarily locked for 15 minutes or requires CAPTCHA verification.
2. **Global API Rate Limiting:**
   - Configured via `@nestjs/throttler` (e.g. 100 requests per minute per authenticated user IP).
3. **Public Lead Ingestion Protection:**
   - Public website form ingestion endpoints enforce IP rate limiting (e.g. max 10 submissions/minute) and honeypot field verification.
