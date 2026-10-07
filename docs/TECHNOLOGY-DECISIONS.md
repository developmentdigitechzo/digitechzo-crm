# DigiTechzo CRM — Technology Decisions & Evaluation

> **STATUS:** SPECIFICATION / ARCHITECTURE EVALUATION  
> **Phase:** Phase 0 — Planning & Architectural Baseline  
> **Note:** These are evaluated architectural recommendations and research baselines. Zero package installations or code implementations exist in this documentation phase.

---

## 1. Technology Status Matrix

| Layer / Component | Evaluated Choice | Technology Status | Evaluation Notes / Alternatives |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React 19.x** | **CURRENT RECOMMENDATION / PLANNED FRONTEND STACK** | Modern concurrency, robust ecosystem. Alternative: Next.js, Vue 3 |
| **Frontend Build Tool** | **Vite** | **CURRENT RECOMMENDATION / PLANNED FRONTEND STACK** | Sub-second HMR, optimized rollups. Alternative: Webpack, Turbopack |
| **Language** | **TypeScript 5.x** | **CURRENT RECOMMENDATION** | End-to-end type safety, shared DTO interfaces. Alternative: JavaScript |
| **Styling** | **Tailwind CSS** | **CURRENT RECOMMENDATION / PLANNED FRONTEND STACK** | Utility-first styling, zero runtime overhead. Alternative: Plain CSS |
| **UI Component System** | **shadcn/ui + Radix UI** | **CURRENT RECOMMENDATION / PLANNED FRONTEND STACK** | Accessible headless primitives, full source control. Alternative: MUI, AntD |
| **Server State Management**| **TanStack Query** | **CURRENT RECOMMENDATION / PLANNED FRONTEND STACK** | Automatic caching, optimistic mutations. Alternative: Redux Toolkit, SWR |
| **Drag and Drop Engine** | **@dnd-kit** | **CURRENT RECOMMENDATION / PLANNED FRONTEND STACK** | Accessible, touch-friendly Kanban interactions. Alternative: react-beautiful-dnd |
| **Backend Framework** | **NestJS (Modular Monolith)** | **CURRENT RECOMMENDATION** | Enterprise modularity, TypeScript-first, DI architecture. Alternative: Fastify, Express |
| **Database Engine** | **PostgreSQL** | **CURRENT RECOMMENDATION** | Relational integrity, JSONB support, ACID compliance. Alternative: MySQL |
| **Data Access Layer** | **Repository Pattern + Prisma** | **CURRENT RECOMMENDATION** | Domain decoupling, type-safe queries, automated migrations. Alternative: Drizzle, TypeORM |
| **Authentication Strategy**| **JWT + Rotating Refresh Tokens**| **CURRENT RECOMMENDATION** | Stateless auth, low latency, database revocation list. Alternative: Session cookies |
| **Password Hashing** | **Argon2id** | **CURRENT RECOMMENDATION** | Memory-hard password hashing algorithm. Alternative: bcrypt, PBKDF2 |
| **Background Jobs** | **Database / In-Process** | **CURRENT RECOMMENDATION** | Low operational complexity for initial phase. |
| **Distributed Job Queues** | **Redis + BullMQ** | **DEFERRED** | Deferred until high background scale necessitates distributed clusters. |
| **File Storage Provider** | **StorageAdapter (Local / S3)** | **TBD / OPEN** | Provider-agnostic adapter. Provider candidates: AWS S3, Cloudflare R2, DigitalOcean Spaces (Research options) |
| **Telephony Provider** | **TelephonyAdapter** | **TBD / OPEN** | Provider-agnostic adapter. Provider candidates: Exotel, Twilio, Plivo, Asterisk (Research options) |
| **WhatsApp Provider** | **MessagingAdapter** | **TBD / OPEN** | Provider-agnostic adapter. Provider candidates: Meta Cloud API, Gupshup, Wati (Research options) |
| **Speech-to-Text (STT)** | **SttAdapter** | **TBD / OPEN** | Provider-agnostic adapter. Provider candidates: Whisper, Deepgram, Google STT (Research options) |
| **AI / LLM Engine** | **LlmAdapter** | **TBD / OPEN** | Provider-agnostic adapter. Provider candidates: OpenAI, Anthropic, Google Gemini (Research options) |
| **Application Hosting** | **Cloud VPS / Container Host** | **TBD / OPEN** | Hosting candidates: AWS ECS/RDS, Cloud VPS (Ubuntu + Docker), PaaS (Research options) |

---

## 2. Classification Definitions

1. **LOCKED:** Formally approved by project owner and locked against alterations. *(No technologies are classified as locked without final owner sign-off).*
2. **CURRENT RECOMMENDATION / PLANNED FRONTEND STACK:** The evaluated and recommended architectural choice based on project requirements. Subject to change prior to Phase 1/Phase 3 initialization if owner directs.
3. **TBD / OPEN:** Provider or platform selection is explicitly undecided and intentionally abstracted behind neutral adapter interfaces. Specific provider evaluation will occur immediately before the corresponding implementation phase.
4. **DEFERRED:** Explicitly excluded from MVP/early phases to minimize operational overhead and maximize delivery velocity.

---

## 3. Detailed Architectural Rationales (Proposed Stack)

### 3.1 Frontend Architecture (Current Recommendation)
* **React + Vite + TypeScript:** Provides high developer velocity with fast Hot Module Replacement (HMR). The Single Page Application (SPA) architecture allows the sales team to transition between leads, pipeline boards, and daily work queues with zero full-page reloads.
* **shadcn/ui + Tailwind CSS:** Rather than locking into a rigid third-party component library (like MUI or Ant Design), shadcn/ui places accessible Radix UI primitives directly into the codebase. This ensures 100% theme customization, lightweight bundles, and zero vendor lock-in.
* **TanStack Query (React Query):** Eliminates complex client-side global state for server data. Handles caching, background invalidation, optimistic UI updates (essential for Kanban drag-and-drop), and deduplication of API calls automatically.
* **dnd-kit:** Modern, lightweight drag-and-drop toolkit specifically chosen for its accessibility, high performance with virtualized columns, and touch support for tablet-based sales updates.

### 3.2 Backend Architecture (Current Recommendation)
* **NestJS Modular Monolith:** A modular monolith provides the ideal balance between rapid development, clean separation of concerns, and low operational overhead for DigiTechzo CRM. Modules (`LeadsModule`, `DealsModule`, `TasksModule`, `AuthModule`) maintain strict encapsulation via clear interfaces without the operational complexity of distributed microservices.
* **Repository Pattern + Prisma:** Domain services interact solely with abstract repository interfaces (e.g., `ILeadRepository`, `IDealRepository`). The concrete Prisma implementation is injected via NestJS Dependency Injection. This ensures database queries are isolated and makes unit testing trivial through mock repositories.
* **PostgreSQL:** Evaluated for relational data integrity, strong foreign key guarantees, indexing capabilities, and JSONB support for unstructured activity payloads and AI extraction logs.

### 3.3 Authentication & Security (Current Recommendation)
* **JWT Access Tokens (Short-Lived: 15 mins):** Transmitted via HTTP headers for stateless authorization.
* **Rotating Refresh Tokens (Long-Lived: 7 days):** Stored as hashed tokens in the database. Every refresh request rotates the token, invalidating the previous one. If a token reuse attack is detected, the entire session family is revoked immediately.
* **Argon2id:** Configured with recommended memory and iteration cost parameters for password security.

### 3.4 Provider-Agnostic Adapter Pattern (TBD Services)
To insulate the core CRM from vendor pricing changes, API deprecations, or regional provider requirements, all external communication is architected through strict TypeScript interfaces:
1. `StorageAdapter` (`saveFile`, `getFileUrl`, `deleteFile`) — Provider TBD
2. `TelephonyAdapter` (`initiateCall`, `hangupCall`, `fetchRecording`, `parseWebhook`) — Provider TBD
3. `MessagingAdapter` (`sendMessage`, `sendTemplate`, `parseInboundWebhook`) — Provider TBD
4. `SttAdapter` (`transcribeAudio`) — Provider TBD
5. `LlmAdapter` (`generateStructuredExtraction`, `generateSummary`) — Provider TBD
