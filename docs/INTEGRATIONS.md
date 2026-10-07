# DigiTechzo CRM — Third-Party Integrations Specification

> **STATUS:** SPECIFICATION / ARCHITECTURE PLANNING  
> **Architecture Classification:** **TARGET INTEGRATION MODEL**  
> **Phase:** Phase 0 — Documentation / Planning  
> **Principle:** All external integrations are architected behind provider-agnostic adapter interfaces. Providers listed are research options only.

---

## 1. Integrations Status & Provider Matrix

| Integration Category | Source / Service | Status | Target Provider / Protocol | MVP Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Lead Ingestion** | **Meta Lead Ads** | **PLANNED** | Meta Graph API Webhooks (`leadgen` webhook) | P0 |
| **Lead Ingestion** | **Google Ads Lead Forms** | **PLANNED** | Google Ads Webhook Ingestion Endpoint | P0 |
| **Lead Ingestion** | **Website & Landing Forms** | **PLANNED** | DigiTechzo Public Ingest REST API (`/api/v1/leads/ingest/public-form`) | P0 |
| **Messaging** | **WhatsApp Business API** | **TBD / OPEN** | `MessagingAdapter` (Research options: Meta Cloud API / Gupshup / Wati) | P1 |
| **Telephony & Calls** | **Cloud Telephony / PBX** | **TBD / OPEN** | `TelephonyAdapter` (Research options: Exotel / Twilio / Plivo / Asterisk) | P1 |
| **Calendar Sync** | **Google Calendar** | **PLANNED** | Google Calendar REST API (OAuth2) | P1 |
| **Email Communication** | **Transactional & In-App**| **PLANNED** | SMTP / SendGrid / Amazon SES / Postmark (Research options) | P1 |
| **Payments / Invoicing** | **Payment Gateway** | **TBD / OPEN** | Razorpay / Stripe / Cashfree (Research options) | P1 |
| **Accounting Software** | **Invoicing / Books** | **DEFERRED** | Zoho Books / Tally / QuickBooks API | Post-MVP |
| **Speech-to-Text (STT)**| **Call Audio Transcription**| **TBD / OPEN** | `SttAdapter` (Research options: Whisper / Deepgram / Google STT)| P2 |
| **AI Sales Assistant** | **Conversational Intelligence**| **TBD / OPEN**| `LlmAdapter` (Research options: OpenAI / Anthropic / Gemini) | P2 |

---

## 2. Ingestion Integration Architecture (Target Model)

### 2.1 Meta Lead Ads Integration
- **Mechanism:** Secure HTTPS Webhook (`POST /api/v1/leads/ingest/webhook/meta`).
- **Handshake:** Supports Meta webhook challenge verification token (`hub.challenge`).
- **Payload Extraction:** Decrypts and queries Meta Graph API for lead form field values (Name, Phone, Email, City, Service Interest).
- **Security:** Validates `X-Hub-Signature-256` HMAC signature using organization Meta App Secret.

### 2.2 Google Ads & Web Landing Pages
- **Mechanism:** REST Webhook ingestion (`POST /api/v1/leads/ingest/public-form`).
- **Authentication:** Ingestion API Key passed in `x-api-key` header.
- **Bot Mitigation:** Honeypot field inspection, origin domain verification, and IP-based rate limiting.

---

## 3. Communication Integrations (Target Model)

### 3.1 WhatsApp Business Architecture
- **Adapter Contract:** `IMessagingAdapter` handles outbound template dispatch, session messages, and inbound webhook parsing.
- **Decoupling:** Domain logic interacts strictly with `sendMessage(to, text)` and `sendTemplate(to, templateId, params)`.
- **Inbound Webhook:** Ingests incoming customer replies directly into the lead's chronological timeline.

### 3.2 Cloud Telephony Architecture
- **Adapter Contract:** `ITelephonyAdapter` exposes `initiateCall({ fromAgent, toCustomer, leadId })`, `hangup(callId)`, and `fetchRecording(recordingId)`.
- **Webhook Handlers:** Receives CDR (Call Detail Records) and recording ready callbacks, updating lead activity history with duration and audio stream links.

---

## 4. Calendar & Payment Integrations (Target Model)

### 4.1 Google Calendar Sync
- **OAuth2 Flow:** BDE connects their Google Workspace account.
- **Booking:** When a demo is scheduled in the CRM, an event is automatically created in Google Calendar with Google Meet video conferencing links.

### 4.2 Payment Gateway Integration
- **Functionality:** Generates payment milestone links for booking advances or full contract payments.
- **Webhook:** Ingests payment settlement webhooks to automatically mark deals as `Closed-Won` and initialize customer onboarding.
