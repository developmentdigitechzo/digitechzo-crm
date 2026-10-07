# DigiTechzo CRM — Open Questions & Decisions for Owner Review

> **STATUS:** SPECIFICATION / PENDING STAKEHOLDER REVIEW  
> **Phase:** Phase 0 — Documentation / Planning  
> **Note:** The following architectural, provider, infrastructure, and business decisions require explicit owner sign-off prior to corresponding implementation phases. All candidate providers are research options only.

---

## 1. Third-Party Provider Selections (TBD / OPEN)

### 1.1 WhatsApp Business API Provider
* **Context:** A provider is required to power inbound lead capture, session messaging, and outbound template dispatch.
* **Research Candidates:**
  1. *Meta Cloud API (Direct):* Lowest per-conversation cost, direct Meta access, requires Meta Developer App verification.
  2. *Gupshup:* Enterprise WhatsApp BSP with rich template management and managed billing.
  3. *Wati / Interakt:* Turnkey WhatsApp inbox with API capabilities; incurs monthly SaaS subscription.
* **Decision Required:** Which WhatsApp provider account should be integrated into `MessagingAdapter` during Phase 7?

### 1.2 Telephony & Call Infrastructure Provider
* **Context:** Cloud telephony is needed for virtual inbound numbers (DID), click-to-call bridging, call routing, and call recordings.
* **Research Candidates:**
  1. *Exotel:* Indian telecom compliance, native virtual numbers, reliable PSTN call bridging.
  2. *Twilio:* Worldwide coverage, mature WebRTC SDK, higher per-minute rates in India.
  3. *Plivo:* Competitive calling rates, SIP trunking.
  4. *Self-Hosted Asterisk / FreePBX:* Open-source telephony server.
* **Decision Required:** Which telephony provider will provision DigiTechzo's calling numbers and integrate into `TelephonyAdapter` during Phase 8?

### 1.3 Speech-to-Text (STT) & Audio Transcription Provider
* **Context:** Used to transcribe call recordings for AI summarization (Phase 9 / P2).
* **Research Candidates:**
  1. *OpenAI Whisper API:* Multilingual transcription with strong accent support.
  2. *Deepgram:* Low latency, streaming transcription.
  3. *Google Cloud Speech-to-Text:* Strong dialect support.
* **Decision Required:** Which STT engine should be targeted for `SttAdapter`?

### 1.4 Large Language Model (AI Engine) Provider
* **Context:** Powers call summarization, structured BANT extraction, objection categorization, and coaching suggestions.
* **Research Candidates:**
  1. *OpenAI (GPT Models):* Structured JSON output schema adherence.
  2. *Anthropic (Claude Models):* Conversational reasoning and nuanced transcript analysis.
  3. *Google (Gemini Models):* Fast inference latency and cost efficiency.
* **Decision Required:** Which AI API provider / model family should be targeted for `LlmAdapter`? *(Will be researched again immediately prior to Phase 9).*

---

## 2. Infrastructure & Hosting Decisions (TBD / OPEN)

### 2.1 Production Application & Database Hosting
* **Context:** Deployment target for the containerized backend API and PostgreSQL database.
* **Research Candidates:**
  1. *Cloud VPS (DigitalOcean / Hetzner / Linode):* Ubuntu 24.04 LTS + Docker Compose + PostgreSQL.
  2. *AWS (ECS Fargate + RDS PostgreSQL + S3):* Enterprise high availability, automated scaling.
  3. *PaaS (Render / Railway / Supabase DB):* Rapid deployment platform.
* **Decision Required:** What is the approved cloud hosting infrastructure provider?

### 2.2 Cloud Object Storage Provider
* **Context:** Secure storage for client proposal documents, contracts, and call recording audio files.
* **Research Candidates:** AWS S3, Cloudflare R2 (zero egress fees), DigitalOcean Spaces.
* **Decision Required:** Which S3-compatible cloud storage bucket will be provisioned?

### 2.3 Production Domain & SSL
* **Context:** Fully Qualified Domain Name (FQDN) for CRM frontend and backend API.
* **Research Candidates:** `crm.digitechzo.com` (Frontend) and `api.crm.digitechzo.com` (Backend), or unified under reverse proxy path `/api`.
* **Decision Required:** What is the target production domain structure?

---

## 3. Business Configuration & Policy Questions

### 3.1 Initial Service Catalog Taxonomy
* **Context:** Standardizing service interest tags for lead qualification and pipeline filtering.
* **Proposed Initial Taxonomy:**
  - `Custom Web Application Development`
  - `Mobile App Development (iOS / Android / Flutter)`
  - `Digital Marketing & Performance Ads`
  - `SEO & Organic Growth`
  - `UI/UX Design & Branding`
  - `Cloud & DevOps Consulting`
  - `Enterprise Software / CRM Solutions`
* **Decision Required:** Does DigiTechzo wish to add, remove, or modify any initial service categories?

### 3.2 Lead Inactivity Thresholds & SLA Timing
* **Context:** Inactivity and overdue alerts for BDEs and Managers.
* **Proposed Rules:**
  - First Inactivity Alert: 24 hours with no logged interaction.
  - Critical Escalation Alert: 48 hours with no activity -> Escalate to Sales Manager.
  - First Contact SLA: 30 minutes from inbound lead capture during business hours (9:30 AM – 7:00 PM IST).
* **Decision Required:** Are these SLA timeframes aligned with DigiTechzo sales team operations?

### 3.3 Default Pipeline Stages
* **Context:** Standardizing default visual pipeline Kanban stages.
* **Proposed Stages:**
  1. `New Lead` (0%)
  2. `Qualification` (10%)
  3. `First Contact / Discovery` (25%)
  4. `Meeting / Demo Scheduled` (40%)
  5. `Proposal Sent` (60%)
  6. `Negotiation & Review` (80%)
  7. `Closed-Won` (100%)
  8. `Closed-Lost` (0%)
* **Decision Required:** Are there any additional intermediary stages required for DigiTechzo's sales lifecycle?
