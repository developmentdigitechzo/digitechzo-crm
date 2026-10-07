# DigiTechzo CRM — WhatsApp Messaging Architecture

> **STATUS:** SPECIFICATION / PLANNING  
> **Architecture Classification:** **TARGET ARCHITECTURE / PROPOSED ADAPTER MODEL**  
> **Provider Selection:** **TBD / OPEN** (Decoupled via `MessagingAdapter`)  
> **Phase:** Phase 0 — Documentation / Planning  
> **Note:** This document specifies the WhatsApp integration architecture, webhook handling, template governance, and conversation threading. Provider candidates are research options only. No implementation is executed in this phase.

---

## 1. Target Topology & Message Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 DigiTechzo CRM (Proposed)                   │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ BDE WhatsApp Composer │       │ Timeline Chat Stream  │  │
│  │ & Template Selector   │       │ (2-Way Historical)    │  │
│  └───────────┬───────────┘       └───────────▲───────────┘  │
│              │                               │              │
│              ▼                               │              │
│  ┌───────────────────────────────────────────┴───────────┐  │
│  │                    WhatsAppService                    │  │
│  │   (Template Validation, Delivery Tracking, Dedup)     │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   MessagingAdapter                    │  │
│  │       (Provider-Agnostic Interface Definition)        │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTPS Webhooks & Graph API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 WhatsApp API Provider (TBD)                 │
│      Research Candidates: Meta Cloud API / Gupshup / Wati   │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   Inbound Webhooks    │       │ Outbound Template/Msg │  │
│  └───────────────────────┘       └───────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Functional Capabilities (Target Model)

### 2.1 Inbound WhatsApp Handling & Lead Ingestion
1. **Webhook Ingestion:** When a prospect texts DigiTechzo's WhatsApp Business number, the provider fires `POST /api/v1/integrations/whatsapp/webhook`.
2. **Number Matching & Deduplication:**
   - The sender's phone number is normalized to E.164.
   - If matched against an active `LeadPhone`, the incoming text/media is appended to that lead's chronological activity timeline.
   - If the sender is unknown, a new `Lead` entity is created (`source = 'WHATSAPP'`, `phone = senderPhone`), automatically routed to the BDE Round-Robin queue, and tagged for first response.
3. **Real-time Alert:** The assigned BDE receives an in-app badge notification: *"New WhatsApp message from [Lead Name]"*.

### 2.2 Outbound Messaging & 24-Hour Service Window
- **Session (Freeform) Messages:** When a customer has messaged DigiTechzo within the preceding 24 hours (Meta's customer care window), BDEs can compose custom, freeform text replies directly inside the CRM.
- **Pre-approved Templates:** Outside the 24-hour window, outbound messages must utilize Meta-approved WhatsApp Message Templates (e.g., Lead Welcome, Demo Reminder, Follow-up Request, Proposal Notification).

### 2.3 Message Delivery Status Tracking
The system tracks message lifecycle updates received via webhooks:
- `SENT`: Successfully dispatched to carrier/Meta.
- `DELIVERED`: Delivered to client device.
- `READ`: Blue ticks / read receipt received.
- `FAILED`: Delivery failed (e.g. invalid phone number, opted-out recipient). Error reason logged in activity metadata.

### 2.4 Automated WhatsApp Triggers (P2 Scope)
1. **Welcome Message:** Automatically send an approved greeting template upon inbound lead capture from Meta Ads or Website forms.
2. **Meeting Reminders:** Dispatch an automated WhatsApp reminder prior to scheduled demo meetings.
3. **Proposal Notification:** Ping the prospect with proposal highlights and document download link upon quotation dispatch.

---

## 3. Provider Candidates Matrix (Research Options Only)

| Candidate Provider | Protocol / Integration | Research Notes / Strengths | Considerations | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Meta Cloud API** | Direct Meta Graph API | Direct Meta access, no intermediary markup | Requires Meta Developer App setup | Research Option |
| **Gupshup** | Enterprise REST API | Indian enterprise BSP, managed templates | Provider platform fee per message | Research Option |
| **Wati** | REST API & Inbox | Turnkey UI fallback, ease of use | Monthly SaaS subscription cost | Research Option |
| **Twilio WhatsApp** | Unified Twilio API | Single SDK for SMS, Voice, and WhatsApp | Higher international per-message pricing | Research Option |

> **Note:** WhatsApp provider selection is **TBD**. The CRM code will interface exclusively through `IMessagingAdapter`. Specific providers will be researched again immediately before Phase 7 implementation.
