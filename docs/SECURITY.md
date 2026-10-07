# DigiTechzo CRM — Security & Compliance Architecture

> **STATUS:** SPECIFICATION / PLANNING  
> **Version:** 1.0.0  
> **Security Baseline:** Zero Trust, Defense-in-Depth, Principle of Least Privilege

---

## 1. Security Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                       ATTACK VECTORS                        │
│   (Brute Force, XSS, CSRF, Injection, Scraping, Replay)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    NETWORK & EDGE DEFENSE                   │
│   • TLS 1.3 Strict HTTPS Transport                          │
│   • Cloudflare / Edge DDoS & WAF Protection                 │
│   • CORS Origin Whitelisting                                │
│   • Global Rate Limiting (@nestjs/throttler)                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION SECURITY LAYER                 │
│   • Helmet.js HTTP Security Headers (CSP, HSTS, X-Frame)    │
│   • Argon2id Password Hashing (Memory-Hard)                 │
│   • Short-Lived JWT (15m) + Rotating Refresh (HttpOnly)     │
│   • Zod / Class-Validator Strict Request DTO Sanitization   │
│   • Declarative RBAC + Tenant Scoping Guards                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA & STORAGE SECURITY                   │
│   • Parameterized Prisma SQL Queries (SQLi Proof)           │
│   • Encrypted-at-Rest PostgreSQL Database (AES-256)         │
│   • Pre-Signed Expiring URLs for File & Audio Downloads     │
│   • Immutable Audit Logs on State Mutations & Data Exports  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Security Controls

### 2.1 Password Hashing & Account Security
- **Algorithm:** Argon2id with 64 MB memory cost, 3 iterations, and 4 threads.
- **Complexity Policy:** Minimum 10 characters, requiring uppercase, lowercase, numeric, and symbol characters.
- **Brute Force Lockout:** 5 consecutive failed login attempts trigger a 15-minute temporary lockout.

### 2.2 Token Handling & Session Security
- **Access Tokens:** 15-minute expiration, stateless validation.
- **Refresh Tokens:** High-entropy cryptographically random strings, hashed with SHA-256 in the database.
- **Storage:** Refresh tokens are transmitted strictly via `HttpOnly`, `Secure`, `SameSite=Strict`, `__Host-` prefixed cookies to eliminate XSS token theft.
- **Automatic Reuse Detection:** If an expired or already rotated refresh token is presented, all active sessions for that user account are immediately revoked.

### 2.3 Injection & Input Sanitization
- **SQL Injection:** All database operations utilize Prisma ORM parameterized queries or strict type-checked query builders. Raw unparameterized SQL concatenation is strictly forbidden.
- **Cross-Site Scripting (XSS):** React automatically escapes HTML strings by default. Dangerous directives (`dangerouslySetInnerHTML`) are banned in codebase lint rules. User-generated Markdown is sanitized using DOMPurify.
- **Data Transfer Object Validation:** Incoming payloads are stripped of any non-whitelisted fields before reaching controller business logic.

### 2.4 Webhook Integrity & Signature Verification
- **Meta Lead Ads:** Inbound webhooks validate `X-Hub-Signature-256` HMAC-SHA256 headers against the configured Meta App Secret.
- **Telephony & WhatsApp:** Inbound callbacks require carrier signature headers or pre-shared bearer tokens.
- **Public Website Forms:** Enforce honeypot fields, IP rate limits, and origin domain validation.

### 2.5 File Upload & Call Recording Protection
- **Storage:** Client documents and audio recordings are stored in private cloud buckets with zero public access.
- **Access:** Generated pre-signed download URLs expire in 15 minutes and are only accessible by authenticated users with permission to view the corresponding lead record.
- **Validation:** Uploaded files are verified by magic byte inspection (MIME sniffing) and restricted to allowed types (`.pdf`, `.png`, `.jpg`, `.docx`, `.xlsx`).

### 2.6 Audit Logging & Traceability
Every sensitive action writes an immutable record to the `audit_logs` table:
- User login / logout / failed login attempts
- Lead reassignments and stage changes
- Commercial proposal revisions and discounts
- Bulk export of lead or customer records (capturing actor ID, IP, filters, and record count)
- User role and permission alterations

### 2.7 Data Retention & Privacy
- Soft deletion is used for operational lead records (`deletedAt != NULL`).
- Hard deletion is restricted to Admins for GDPR/data privacy erasure compliance.
- Customer financial transaction references and PII are protected with encrypted transmission and scoped database access.
