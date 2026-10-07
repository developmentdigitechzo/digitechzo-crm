# DigiTechzo CRM — MVP Scope & Feature Prioritization

> **STATUS:** SPECIFICATION / PLANNING  
> **Version:** 1.0.0  
> **Principle:** Build the active sales engine first. Focus on core lead tracking, qualification discipline, pipeline visibility, and follow-up accountability before adding advanced automation or AI.

---

## 1. Prioritization Framework

The CRM feature roadmap is organized into three distinct tiers:
- **P0 (MVP Core — Build First):** Essential operational baseline required for day-to-day sales execution and management visibility. Without these, the CRM cannot function.
- **P1 (Core Enhancements):** Commercial workflow expansion, deep communication logs, proposal tracking, and demo coordination.
- **P2 (Scale, Automation & Intelligence):** Autonomous routing, SLA escalations, background workers, and AI-driven conversational intelligence.

---

## 2. Priority Breakdown Table

| Priority | Module / Capability | Detailed Scope |
| :--- | :--- | :--- |
| **P0** | **Lead Management** | • Manual lead creation and editing<br>• CSV/Excel lead import with field mapping<br>• Webhook lead capture (Website forms & Meta Ads)<br>• Search, filter, sorting, pagination<br>• Duplicate detection (Phone & Email normalization)<br>• Multi-contact data (Phone, Secondary Phone, Email, WhatsApp) |
| **P0** | **Lead Qualification** | • Mandatory BANT qualification fields<br>• Lead status categorization: `Hot`, `Warm`, `Cold`, `Unqualified`<br>• Configurable lead scoring logic<br>• Service interest tagging<br>• Qualification history & audit notes |
| **P0** | **Sales Pipeline** | • Visual Kanban board with drag-and-drop movement<br>• Configurable pipeline stages<br>• Deal value, currency, and expected closing dates<br>• Win probability and forecast value<br>• Mandatory `Lost Reason` on deal loss<br>• Filters by BDE, Source, Service, and Date |
| **P0** | **Follow-up Management** | • Mandatory "Next Action" system on every active lead<br>• Date, time, action type (Call, WhatsApp, Email, Meeting), and owner<br>• Overdue follow-up visual flags and banner alerts<br>• Daily BDE task queue<br>• Activity outcome logging (`Completed`, `Rescheduled`, `Missed`) |
| **P0** | **Team & Permissions** | • User authentication (JWT + rotating refresh tokens)<br>• Roles: `Admin`, `Sales Manager`, `BDE / Sales Rep`, `Marketing`, `Delivery`<br>• Role-Based Access Control (RBAC) & data scoping<br>• Manual & basic round-robin lead assignment |
| **P0** | **Dashboards & Reporting** | • BDE Daily Work Dashboard (Overdue, Pending Calls, Today's Demos, Hot Leads)<br>• Manager Executive Dashboard (Lead volume, Funnel conversions, Pipeline value, Won/Lost totals, BDE performance metrics) |
| **P1** | **Meeting / Demo Management** | • Meeting and demo scheduling linked to leads/deals<br>• Integration with Google Meet / Zoom meeting links<br>• Attendance status tracking (`Scheduled`, `Completed`, `No-Show`, `Rescheduled`)<br>• Post-demo outcome recording |
| **P1** | **Proposal & Quotation** | • Proposal and quotation record creation<br>• Versioning and document attachment storage<br>• Status tracking (`Draft`, `Sent`, `Under Review`, `Accepted`, `Declined`)<br>• Commercial revision tracking & discount logging |
| **P1** | **Communication History** | • Unified chronological activity timeline<br>• Manual call outcome logging with duration and notes<br>• Email exchange logging (manual and SMTP sync)<br>• WhatsApp message history view (via provider webhook ingestion) |
| **P2** | **Advanced Automation** | • Automated SLA timers (e.g. alert manager if lead uncontacted for >30m)<br>• Automated WhatsApp/Email welcome templates on lead capture<br>• Automated pre-meeting reminder notifications to prospects<br>• Complex multi-step workflow automations |
| **P2** | **AI & Intelligence** | • AI call summary extraction from transcripts<br>• Structured requirement, budget, timeline, and objection extraction<br>• Fact vs. inference separation<br>• AI-assisted lead scoring & follow-up message generation<br>• BDE sales coaching recommendations |

---

## 3. Explicitly Deferred Capabilities

To maintain high development velocity and ensure rock-solid operational stability, the following capabilities are **explicitly excluded from early development phases**:

1. **Redis / BullMQ Queue Infrastructure:** Initially, asynchronous tasks (e.g., webhook processing, emails) will run in-process or via lightweight database-backed job tables until traffic requires distributed Redis clusters.
2. **Custom CPQ (Configure, Price, Quote) Dynamic Calculation Engine:** Standard proposal uploads, line-item summaries, and version tracking will be used instead of complex mathematical CPQ engines.
3. **Full Email Client / Webmail Clone:** In-app rich email composer will be supported, but full IMAP/POP3 two-way inbox sync with arbitrary email folders is deferred.
4. **Native Mobile Applications (iOS / Android):** Initial focus is a mobile-responsive Web SPA. Native mobile app builds are deferred.
5. **Multi-Tenant SaaS Self-Service Billing:** The system will be deployed as a dedicated single-organization CRM instance for DigiTechzo. Multi-tenant billing and self-serve signup are deferred.
6. **Real-Time WebRTC In-Browser Softphone:** Telephony will initially support click-to-call via bridge/forwarding or external softphone protocol handlers (`tel:`) prior to building full WebRTC browser-based media gateways.
7. **Autonomous Conversational AI Agents:** AI will operate in an assistant/advisory role (summarization, extraction, draft suggestions) rather than fully autonomous voice or chat agents interacting directly with clients without human review.

---

## 4. Phase Exit Criteria

### P0 Exit Criteria
- [ ] Lead capture works via Web forms and Meta Webhooks.
- [ ] BDEs can view and complete their daily follow-up queues.
- [ ] Mandatory "Next Action" is enforced across all active leads.
- [ ] Visual Pipeline board accurately updates deal stages and calculates revenue.
- [ ] Managers can review conversion metrics on the Executive Dashboard.
- [ ] RBAC successfully isolates lead data between BDEs where configured.

### P1 Exit Criteria
- [ ] Demos and proposals are tracked through structured lifecycle stages.
- [ ] Full unified timeline aggregates calls, notes, proposals, and WhatsApp logs.
- [ ] Commercial revisions maintain version history and discount records.

### P2 Exit Criteria
- [ ] Background automation executes SLA escalations reliably.
- [ ] AI extraction provides structured, validated JSON insights from interaction transcripts.
- [ ] Automated messaging sends timely reminders without manual BDE intervention.
