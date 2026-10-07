# DigiTechzo CRM — Business Rules & Operational Invariants

> **STATUS:** SPECIFICATION / PLANNING  
> **Version:** 1.0.0  
> **Core Principle:** Sales activity drives the CRM. The system strictly enforces process integrity so that leads cannot be lost, forgotten, or left without accountability.

---

## 1. Core Architectural Invariants

### Rule BR-OWN-01: Mandatory Lead Ownership
* **Rule:** Every lead in the system must always have an assigned owner (`ownerId`).
* **Behavior:** 
  - Inbound leads captured via webhooks or public forms must immediately be assigned via the default organization assignment strategy (Round-Robin or Default Sales Manager queue).
  - A lead cannot be saved or transitioned with `ownerId = NULL`.
  - If a BDE user account is deactivated, all active leads owned by that user must be reassigned by an Admin/Manager before deactivation is finalized.

### Rule BR-ACT-01: Mandatory Next Action on Active Leads
* **Rule:** Every active lead (any lead not in `Closed-Won`, `Closed-Lost`, or `Unqualified` status) must have a pending, scheduled "Next Action".
* **Behavior:**
  - Whenever an interaction (Call, WhatsApp, Meeting, Note) is logged, the system prompts and requires the user to define the next action (Action Type, Date, Time, Purpose).
  - If a user attempts to leave an active lead without a scheduled next action, the system warns the user and surfaces the lead in the "No Next Action / Attention Required" queue.

### Rule BR-FOL-01: Overdue Follow-up Enforcement
* **Rule:** Follow-up tasks with `scheduledDate + scheduledTime < CurrentTimestamp` and status `PENDING` are immediately classified as `OVERDUE`.
* **Behavior:**
  - Overdue follow-ups must be pinned to the top of the BDE Daily Work Dashboard with visual high-priority indicators.
  - A summary count of overdue follow-ups is reflected on the Sales Manager dashboard.
  - An overdue task cannot simply be cleared without logging an interaction outcome or an explicit reschedule reason.

### Rule BR-INACT-01: Inactivity Alerts (24h / 48h Rule)
* **Rule:** Any active lead with zero logged activities for $\ge 24$ hours (first alert) or $\ge 48$ hours (critical alert) is flagged.
* **Behavior:**
  - Leads with no activity for 24h appear in the BDE's "Needs Attention" queue.
  - Leads with no activity for 48h escalate to the Sales Manager's "Stalled Leads" queue for review and potential reassignment.

---

## 2. Lead Ingestion & Deduplication Rules

### Rule BR-DEDUP-01: Contact Deduplication
* **Rule:** All phone numbers and email addresses must be normalized prior to duplicate checks.
* **Behavior:**
  - Phone numbers are stripped of non-digit characters, converted to E.164 format, and matched across `LeadPhone` records.
  - Emails are trimmed and lowercased, then matched across `LeadEmail` records.
  - If an inbound webhook arrives with a phone/email matching an existing lead:
    - **Active Lead:** The new submission is recorded as a new inbound inquiry activity on the existing lead's timeline and an alert is sent to the current lead owner. A duplicate lead record is *not* created.
    - **Closed-Lost / Unqualified Lead:** If the existing lead was closed $> 90$ days ago, a new re-engagement lead may be created with a link back to historical records.

### Rule BR-SRC-01: Source Immutability
* **Rule:** The original lead source (`source`) and initial UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`) recorded at creation are immutable to preserve campaign attribution integrity.

---

## 3. Lead Qualification & Scoring Rules

### Rule BR-QUAL-01: Structured BANT Completion
* **Rule:** A lead cannot advance beyond the `Qualification` pipeline stage without completing the mandatory qualification questions:
  1. Requirement summary (Text)
  2. Target service line (Selected from taxonomy)
  3. Budget readiness (Budget entered or flagged as "Not Disclosed / Custom")
  4. Decision-maker authority (Direct / Influencer / Evaluator)
  5. Estimated timeline (< 2 weeks, 1 month, 3 months, exploring)

### Rule BR-QUAL-02: Lead Status Classification
* **Rule:** Leads must be assigned exactly one status:
  - **Hot:** High intent, validated budget, immediate timeline (< 1 month), direct decision maker.
  - **Warm:** Validated need, budget in discussion, timeline within 1–3 months.
  - **Cold:** Need identified but low urgency or exploratory budget.
  - **Unqualified:** Spam, student inquiry, competitor research, invalid phone/email, or budget completely below minimum threshold.

### Rule BR-QUAL-03: Mandatory Unqualification Reason
* **Rule:** When marking a lead as `Unqualified`, the user must select a standardized unqualification reason code and provide brief explanatory notes.

---

## 4. Sales Pipeline & Deal Governance Rules

### Rule BR-PIPE-01: Trackable Stage History
* **Rule:** Every movement between pipeline stages must be recorded in the `StageHistory` audit table with:
  - `leadId` / `dealId`
  - `previousStageId` and `newStageId`
  - `changedByUserId`
  - Exact timestamp and calculated `durationInPreviousStageSeconds`

### Rule BR-PIPE-02: Mandatory Closed-Lost Reason
* **Rule:** A deal cannot be transitioned to `Closed-Lost` without selecting a mandatory standardized `LostReason`:
  - `PRICE_TOO_HIGH`
  - `COMPETITOR_CHOSEN`
  - `LACK_OF_FEATURES_OR_CAPABILITY`
  - `TIMING_POSTPONED_OR_CANCELLED`
  - `UNRESPONSIVE_GHOSTED`
  - `INTERNAL_RESOLUTION`
  - `OTHER` (Requires text explanation)

### Rule BR-PIPE-03: Won Deal Commercial Validation
* **Rule:** Transitioning a deal to `Closed-Won` requires:
  1. Total Contract Value $> 0$.
  2. Advance / Booking Amount received (or explicitly marked as "Payment on Delivery").
  3. Signed Proposal / Contract reference.
  4. Target delivery start date.

---

## 5. Communication & Timeline Integrity Rules

### Rule BR-COMM-01: Immutable Activity History
* **Rule:** Chronological activity logs (Calls, WhatsApp messages, Inbound form submissions, Stage transitions, AI summaries) are append-only.
* **Behavior:** Activities cannot be edited or deleted by standard users. Only Admins can redact or soft-delete erroneous notes, and any deletion is logged in `AuditLog`.

### Rule BR-COMM-02: Call Outcome Completeness
* **Rule:** Every logged phone call must have an associated call duration and a standardized call outcome (`CONNECTED`, `NO_ANSWER`, `BUSY`, `WRONG_NUMBER`, `LEFT_VOICEMAIL`, `CALLBACK_REQUESTED`).

---

## 6. Access Control & Data Scoping Rules

### Rule BR-RBAC-01: Role Hierarchy & Lead Visibility
* **Super Admin / Admin:** Unrestricted visibility across all organization leads, deals, settings, and audit logs.
* **Sales Manager:** Full visibility into all leads and deals assigned to members of their designated team. Ability to reassign leads across team members.
* **BDE / Sales Executive:** Visibility strictly limited to leads assigned to them (`ownerId = currentUserId`), plus inbound unassigned leads in their designated territory pool.
* **Marketing Executive:** Read-only visibility into lead sources, campaign metrics, and ingestion logs. No permission to edit commercial terms or reassign owners.
* **Delivery Lead / Account Manager:** Visibility into `Closed-Won` customer accounts, purchased service specifications, and customer handover notes.

### Rule BR-RBAC-02: Export Restrictions
* **Rule:** Bulk export of leads to CSV/Excel is restricted to `Admin` and `Sales Manager` roles only. Every export event is recorded in `AuditLog` with user ID, timestamp, record count, and applied filters.
