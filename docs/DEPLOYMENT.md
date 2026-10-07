# DigiTechzo CRM — Deployment & Infrastructure Specification

> **STATUS:** SPECIFICATION / PLANNING  
> **Architecture Classification:** **TARGET DEPLOYMENT TOPOLOGY**  
> **Hosting & Infrastructure Selection:** **TBD / OPEN**  
> **Phase:** Phase 0 — Documentation / Planning  
> **Note:** This document specifies environment models, configuration structures, backup policies, and monitoring requirements. Provider candidates are research options only. No deployment scripts or server configurations are executed in this phase.

---

## 1. Target Environments Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 Local Development (Target)                  │
│   • Frontend: Vite Dev Server (localhost:5173)              │
│   • Backend: NestJS Dev Server (localhost:3000)             │
│   • Database: Local PostgreSQL                              │
│   • Storage: Local Filesystem (`StorageAdapter.Local`)      │
│   • Mock Mode: Optional MSW Mock API for isolated UI work   │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Staging / QA Environment (Target)             │
│   • Frontend: Staging Static SPA Build                      │
│   • Backend: Containerized NestJS API Service               │
│   • Database: Staging PostgreSQL instance                   │
│   • Storage: Staging Object Storage Bucket                  │
│   • Integrations: Sandbox / Test Webhook Endpoints          │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Production Environment (Target)             │
│   • Frontend: High-Performance Global CDN (HTTPS)           │
│   • Backend: High-Availability Container / Node Host        │
│   • Database: Production PostgreSQL (Automated Backups)     │
│   • Storage: S3-Compatible Cloud Storage (Provider TBD)     │
│   • Monitoring: Centralized Logging & Error Tracking        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Infrastructure Layer Breakdown (Research Options Only)

### 2.1 Frontend Hosting (Research Options)
- **Candidate Options:** Cloudflare Pages, Vercel, AWS CloudFront + S3, or Nginx on Cloud VPS.
- **Build Output:** Optimized static bundle (`/dist`) with immutable hashed assets, gzip/brotli compression, and SPA fallback routing (`/* -> index.html`).

### 2.2 Backend Hosting (Research Options)
- **Candidate Options:** AWS ECS / App Runner, DigitalOcean App Platform, Render, or Dockerized Cloud VPS (Ubuntu 24.04 LTS + PM2 / Docker Compose).
- **Runtime:** Node.js 22 LTS (Alpine container).
- **Process Management:** Multi-core clustering or container replica scaling behind a reverse proxy (Nginx / Caddy / Cloud Load Balancer).

### 2.3 Database Hosting (Research Options)
- **Candidate Options:** AWS RDS PostgreSQL, Supabase Managed Database, DigitalOcean Managed PostgreSQL, or Dedicated VPS PostgreSQL instance with SSL.
- **Connection Management:** Connection pooling configured to manage concurrent connections efficiently.

### 2.4 File & Recording Storage (Research Options)
- **Candidate Options:** AWS S3, Cloudflare R2, DigitalOcean Spaces.
- **Configuration:** Private bucket with pre-signed URLs for authenticated document and call recording downloads.

---

## 3. Environment Variables & Configuration Structure (Proposed)

Configuration is loaded strictly from environment variables validated at startup:

```env
# Application Runtime
NODE_ENV=production
PORT=3000
APP_URL=https://crm.digitechzo.com
API_PREFIX=/api/v1
CORS_ORIGIN=https://crm.digitechzo.com

# Database (Current Recommendation: PostgreSQL)
DATABASE_URL=postgresql://user:password@db-host:5432/digitechzo_crm?sslmode=require
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Authentication & Security
JWT_ACCESS_SECRET=your_256bit_access_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=your_256bit_refresh_secret_here
JWT_REFRESH_EXPIRY=7d
COOKIE_DOMAIN=.digitechzo.com

# Storage Adapter (Provider TBD)
STORAGE_DRIVER=s3 # or local
STORAGE_S3_BUCKET=digitechzo-crm-files
STORAGE_S3_REGION=ap-south-1
STORAGE_S3_ENDPOINT=
STORAGE_S3_ACCESS_KEY=
STORAGE_S3_SECRET_KEY=

# Ingestion Webhooks
META_WEBHOOK_VERIFY_TOKEN=
META_APP_SECRET=
PUBLIC_FORM_API_KEY=

# External Adapters (Providers TBD)
TELEPHONY_PROVIDER=mock
WHATSAPP_PROVIDER=mock
LLM_PROVIDER=mock
```

---

## 4. Backup, Monitoring & Disaster Recovery (Target Policy)

1. **Database Backups:**
   - Automated daily snapshots retained for 30 days.
   - Point-in-time recovery (PITR) enabled with 7-day write-ahead log (WAL) retention.
2. **Health Checks:**
   - `/api/v1/health` endpoint monitoring database connectivity, disk storage, and memory thresholds.
3. **Error Tracking & Telemetry:**
   - Error tracking integration across frontend and backend for unhandled exception capturing.
   - Structured JSON logs streamed to centralized logging service.
