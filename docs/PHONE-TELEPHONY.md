# DigiTechzo CRM — Phone & Telephony Architecture

> **STATUS:** SPECIFICATION / ARCHITECTURE RESEARCH  
> **Architecture Classification:** **TARGET ARCHITECTURE / PROPOSED ADAPTER MODEL**  
> **Provider Selection:** **TBD / OPEN** (Decoupled via `TelephonyAdapter`)  
> **Phase:** Phase 0 — Documentation / Planning  
> **Note:** This document defines the telephony architecture, call routing, recording management, and caller matching workflows. Provider candidates are research options only. No implementation is executed in this phase.

---

## 1. Target Architectural Topology

```
┌─────────────────────────────────────────────────────────────┐
│                 DigiTechzo CRM (Proposed)                   │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Lead View Click-to-   │       │ Incoming Call Toast & │  │
│  │ Call Trigger          │       │ Active Agent Queue    │  │
│  └───────────┬───────────┘       └───────────▲───────────┘  │
│              │                               │              │
│              ▼                               │              │
│  ┌───────────────────────────────────────────┴───────────┐  │
│  │                      PhoneService                     │  │
│  │   (Caller Matching, Lead Creation, CDR Logging)       │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   TelephonyAdapter                    │  │
│  │       (Provider-Agnostic Interface Definition)        │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTPS / Webhook / SIP / REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Telephony Provider (TBD)                    │
│   Research Candidates: Exotel / Twilio / Plivo / Asterisk   │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   PSTN Inbound / IVR  │       │ Outbound Bridge / SIP │  │
│  └───────────────────────┘       └───────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Telephony Capabilities (Target Model)

### 2.1 Outgoing Calls & Click-to-Call
1. **Trigger:** BDE clicks the phone icon next to a lead record.
2. **Execution Options:**
   - **Protocol Handler (`tel:` link):** Native softphone or mobile dialer opens on the BDE's device. (Zero infrastructure cost, manual log).
   - **Click-to-Call Bridge (TelephonyAdapter):**
     - Provider calls the BDE's registered phone / softphone first.
     - Once BDE answers, provider dials the prospective lead and bridges the two legs.
     - Full call audio, ringing duration, and talk time are tracked automatically.

### 2.2 Inbound Call Handling & Caller Matching
When an inbound call rings DigiTechzo's virtual phone numbers (DID):
1. **Webhook Ingestion:** Telephony provider fires `POST /api/v1/integrations/telephony/webhook` with `callerNumber`, `calledDidNumber`, and `callSid`.
2. **Caller Number Matching Logic:**
   - **Case A: Existing Number Found:** PhoneService normalizes the incoming number (E.164) and queries `LeadPhone`. If matched:
     - Screen pop / In-app toast notifies the assigned BDE: *"Incoming Call from [Lead Name] - [Company]"*.
     - Call record is associated with the existing lead's timeline.
   - **Case B: Unknown Number:** If number does not match any existing record:
     - PhoneService auto-creates a new `Lead` record with `source = 'PHONE_INBOUND'`, `fullName = 'Inbound Caller (' + callerNumber + ')'`, and assigns it to the on-duty BDE / Round-Robin queue.
     - Call record is attached to the new lead.

### 2.3 IVR, Queues & Call Routing
- Inbound calls can route through an Interactive Voice Response (IVR) tree.
- Queuing strategies: Simultaneous Ring or Round-Robin hunt group.
- Call Transfers: BDE can transfer an active call leg to another sales engineer or manager.

---

## 3. Call Recording & Storage Architecture

1. **Recording Generation:** When enabled, the telephony provider records the bridged audio channel.
2. **Webhook Notification:** Upon call termination, provider sends a callback containing the secure temporary recording URL.
3. **Storage Pipeline:**
   - `PhoneService` downloads the raw audio file.
   - File is uploaded to secure object storage via `StorageAdapter`.
   - Recording metadata is saved in `activities` table (`metadata.recordingUrl`, `metadata.durationSeconds`).
   - Ephemeral provider recording URL is deleted for compliance and cost control.
4. **Playback Security:** Access to recording audio is restricted to authorized roles (`Admin`, `Sales Manager`, and the assigned `BDE`).

---

## 4. Telephony Provider Candidates (Research Options Only)

| Provider Candidate | Regional Focus | Research Notes / Strengths | Considerations | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Exotel** | India / APAC | Indian telecom compliance, native virtual numbers, IVR | Asia-focused; custom API format | Research Option |
| **Twilio** | Global | Worldwide coverage, WebRTC browser SDK, documentation | Higher per-minute rates in certain regions | Research Option |
| **Plivo** | Global / India | Competitive pricing, strong outbound SIP trunking | Support response times | Research Option |
| **Self-Hosted Asterisk / FreePBX** | Open Source | Zero carrier markup; full hardware/SIP control | High maintenance and DevOps complexity | Research Option |

> **Note:** Provider selection is **TBD**. The CRM code will interface strictly through `ITelephonyAdapter`. Specific providers will be researched again immediately before Phase 8 implementation.
