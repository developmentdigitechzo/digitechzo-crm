# DigiTechzo CRM — System Requirements Specification

> **STATUS:** SPECIFICATION / PLANNING  
> **Version:** 1.0.0  
> **Baseline:** DigiTechzo Sales, Lead Management, and Growth Operations Blueprint

---

## 1. Executive Summary & Core Objective

The DigiTechzo CRM is an operational sales management and execution system designed to support DigiTechzo's business development executives (BDEs), sales managers, delivery leads, and leadership. 

The primary requirement is to transform lead management from static contact storage into an active, disciplined sales pipeline where:
- Every lead is accounted for with an assigned owner.
- Every active lead has an explicit, scheduled "Next Action".
- Communication across voice, WhatsApp, and email is recorded in a unified timeline.
- Pipeline velocity, conversion rates, and revenue metrics are transparently tracked.

---

## 2. Lead Lifecycle Stages

The CRM strictly manages leads through the following standardized lifecycle:

```
[ Lead Capture ]
       │
       ▼
 1. New Lead ──────────────► Inbound lead record created; initial metadata logged
       │
       ▼
 2. Qualification ─────────► BANT criteria, service interest, and urgency assessed
       │
       ▼
 3. Assignment ────────────► Assigned to appropriate BDE / Sales Rep
       │
       ▼
 4. First Contact ─────────► Initial outreach via Call / WhatsApp / Email & outcome recorded
       │
       ▼
 5. Follow-up ─────────────► Scheduled actions with date, time, and explicit objective
       │
       ▼
 6. Meeting / Demo ────────► Product/Service demonstration booked, tracked, and evaluated
       │
       ▼
 7. Proposal ──────────────► Commercial quotation submitted and tracked
       │
       ▼
 8. Negotiation ───────────► Revisions, scope clarifications, and objection handling
       │
       ▼
 9. Won / Lost ────────────► Won (advance/payment recorded) OR Lost (mandatory reason recorded)
       │
       ├───────────────────────────────┐
       ▼                               ▼
 10. Onboarding (Won)             11. Retention / Upsell (Won)
 (Handoff to delivery team)       (Renewals, AMC, Retainers, Cross-sell)
```

---

## 3. Functional Requirements by Module

### 3.1 Lead Capture & Ingestion
* **REQ-CAP-01:** System must capture inbound leads automatically from Meta Lead Ads via webhook.
* **REQ-CAP-02:** System must capture inbound leads from Google Ads / landing page webhook endpoints.
* **REQ-CAP-03:** System must capture website and landing-page form submissions via authenticated/validated public API.
* **REQ-CAP-04:** System must capture inbound WhatsApp conversations as potential leads when originating from unknown numbers.
* **REQ-CAP-05:** System must provide manual lead creation forms for direct sales outreach.
* **REQ-CAP-06:** System must support bulk lead import via CSV and Excel (.xlsx) formats with column mapping and validation.
* **REQ-CAP-07:** System must capture lead source, campaign name, UTM parameters (utm_source, utm_medium, utm_campaign, utm_term, utm_content), industry, location, and initial service interest.
* **REQ-CAP-08:** System must perform duplicate detection based on normalized phone numbers and email addresses upon capture, flagging duplicates or linking them to existing lead records.

### 3.2 Lead Management
* **REQ-LM-01:** System must provide full CRUD (Create, Read, Update, Soft-Delete) operations on lead records.
* **REQ-LM-02:** System must provide high-performance search and filtering across leads by status, owner, source, service interest, creation date, and last activity date.
* **REQ-LM-03:** System must support multi-contact associations (primary phone, secondary phone, WhatsApp number, email addresses).
* **REQ-LM-04:** System must maintain a comprehensive changelog and audit trail for all field updates and state modifications.

### 3.3 Lead Qualification
* **REQ-QUAL-01:** System must enforce qualification questionnaires covering:
  - Requirement / Problem Statement
  - Budget range & readiness
  - Decision-maker status & authority
  - Purchase timeline / urgency
  - Specific service interests (e.g., Web Development, Digital Marketing, Custom Software, App Dev, SEO, etc.)
* **REQ-QUAL-02:** System must categorize lead status into: `Hot`, `Warm`, `Cold`, or `Unqualified`.
* **REQ-QUAL-03:** System must support configurable lead scoring rules based on qualification answers and engagement signals.
* **REQ-QUAL-04:** System must maintain full historical records of all qualification edits and notes.

### 3.4 Lead Assignment & Distribution
* **REQ-ASGN-01:** System must support manual lead assignment and reassignment by Admins and Sales Managers.
* **REQ-ASGN-02:** System must support rule-based automatic lead assignment (e.g., Round Robin among active BDEs, source-based routing, service-based routing).
* **REQ-ASGN-03:** System must notify BDEs immediately upon new lead assignment via in-app notification and email/webhook.

### 3.5 Follow-up & Task Management (Next Action System)
* **REQ-FOL-01:** System must enforce that every active lead has a mandatory scheduled "Next Action" with action type (Call, WhatsApp, Email, Meeting), date, time, owner, and purpose.
* **REQ-FOL-02:** System must provide a dedicated Daily Work Queue for each BDE displaying overdue tasks, today's pending calls, WhatsApp follow-ups, and scheduled demos.
* **REQ-FOL-03:** System must trigger visual and notification alerts for overdue follow-ups.
* **REQ-FOL-04:** System must flag leads that have had no logged activity for 24 hours or 48 hours ("No Activity Alerts").
* **REQ-FOL-05:** System must track follow-up completion status (`Completed`, `Rescheduled`, `Missed`, `Cancelled`) with mandatory outcome notes.

### 3.6 Sales Pipeline & Deals
* **REQ-PIPE-01:** System must provide a visual Kanban board with configurable pipeline stages matching the sales workflow.
* **REQ-PIPE-02:** System must support drag-and-drop movement of deals across pipeline stages.
* **REQ-PIPE-03:** System must capture Deal Value (monetary amount), Currency, Expected Closing Date, and Win Probability per stage.
* **REQ-PIPE-04:** System must filter pipeline views by BDE/Owner, Service Category, Lead Source, and Closing Date range.
* **REQ-PIPE-05:** When moving a deal to `Closed-Lost`, system must enforce selection of a mandatory Lost Reason (e.g., Budget, Competitor, Timeline, Ghosted, Not a Fit) and textual explanation.
* **REQ-PIPE-06:** When moving a deal to `Closed-Won`, system must require entry of total contract value, advance payment received, and handoff notes.

### 3.7 Communication History & Timeline
* **REQ-COMM-01:** System must aggregate all customer touchpoints into a single chronological timeline:
  - Call logs (duration, direction, outcome, recording link where available)
  - WhatsApp messages (inbound and outbound threads)
  - Email exchanges
  - Meeting summaries and demo recordings
  - File attachments, proposals, and contracts
  - Manual notes and internal mentions
* **REQ-COMM-02:** System must support manual logging of phone call outcomes (e.g., Connected, No Answer, Busy, Left Voicemail, Wrong Number, Follow-up Requested).

### 3.8 Meeting & Demo Management
* **REQ-MEET-01:** System must allow BDEs to schedule meetings/demos linked directly to the lead/deal record.
* **REQ-MEET-02:** System must store or generate meeting links (Google Meet, Zoom, MS Teams).
* **REQ-MEET-03:** System must log meeting attendance status (`Scheduled`, `Completed`, `Rescheduled`, `No-Show`, `Cancelled`).
* **REQ-MEET-04:** System must require the BDE to log meeting outcome notes and establish the next follow-up action immediately after demo completion.

### 3.9 Proposals & Commercials
* **REQ-PROP-01:** System must allow creating, uploading, and linking proposals/quotations to specific opportunities.
* **REQ-PROP-02:** System must track proposal versions, submission dates, total quoted values, and discount structures.
* **REQ-PROP-03:** System must track proposal statuses (`Draft`, `Sent`, `Under Review`, `Accepted`, `Revised`, `Declined`).
* **REQ-PROP-04:** System must record commercial revision history when pricing or scope changes occur.

### 3.10 Payments & Customer Management
* **REQ-CUST-01:** System must convert Won leads into formal Customer records with associated project accounts.
* **REQ-CUST-02:** System must maintain customer profiles, key stakeholder contacts, signed contracts, and purchased services.
* **REQ-CUST-03:** System must track payment milestones: Total Contract Value, Advance Paid, Balance Due, Payment Due Dates, and Invoicing Status.
* **REQ-CUST-04:** System must support tracking of ongoing retainers, maintenance contracts (AMC), license renewals, and upsell opportunities.

### 3.11 Team, Roles & Permissions (RBAC)
* **REQ-RBAC-01:** System must support multi-tier user roles:
  - `Super Admin` / `Admin` (Full system access, settings, user management, audit logs)
  - `Sales Manager` (Team-wide visibility, pipeline inspection, lead assignment, reporting)
  - `BDE / Sales Executive` (Own leads, assigned queue, daily tasks, communication logging)
  - `Marketing Executive` (Lead capture sources, campaign metrics, ingestion logs)
  - `Delivery / Account Manager` (Won customer profiles, project handoff, retention tracking)
* **REQ-RBAC-02:** System must enforce strict data scoping (BDEs see only assigned leads or team leads based on organization policy; Managers see their team's data; Admins see all).

### 3.12 Dashboards & Reporting
* **REQ-DASH-01:** System must provide a **BDE Daily Work Dashboard** featuring:
  - Overdue follow-up queue
  - Today's pending calls & WhatsApp follow-ups
  - Scheduled demos for today
  - Proposals awaiting client response
  - Hot leads requiring priority attention
  - Inactive lead alerts (no activity in 24/48h)
* **REQ-DASH-02:** System must provide a **Management Executive Dashboard** featuring:
  - Inbound lead volume (Today, This Week, This Month, Custom Date Range)
  - Full Funnel Conversion Metrics:
    - Lead → Contacted
    - Contacted → Qualified
    - Qualified → Demo / Meeting
    - Demo → Proposal Sent
    - Proposal → Closed-Won
  - Total Pipeline Value & Expected Weighted Revenue
  - Realized Won Revenue vs. Lost Revenue breakdown
  - Lost Reason distribution chart
  - Individual BDE performance (Calls made, meetings held, proposals sent, revenue closed, response time)
  - Campaign & Source ROI (Lead quality and conversion rate per marketing source)
  - Average response time and average sales cycle length

### 3.13 Automation (P2 Scope)
* **REQ-AUTO-01:** System must support automated SLA triggers (e.g., auto-reassign lead if not contacted within 30 minutes during business hours).
* **REQ-AUTO-02:** System must support automated WhatsApp/Email welcome templates sent upon lead capture.
* **REQ-AUTO-03:** System must support scheduled reminder notifications sent to prospects prior to booked demos.

### 3.14 AI Capabilities (P2 Scope)
* **REQ-AI-01:** System must provide structured AI call summarization extracting:
  - Client requirements & pain points
  - Stated budget (if explicitly stated)
  - Timeline & urgency (if explicitly stated)
  - Key objections raised
  - Client questions
  - Explicit next steps agreed
* **REQ-AI-02:** AI analysis must strictly differentiate stated facts from inferences and output strict schema-validated JSON.
* **REQ-AI-03:** System must support AI qualification assistance and recommended follow-up messaging drafts based on past conversation history.

---

## 4. Non-Functional Requirements

### 4.1 Performance & Scalability
* **REQ-NFR-01:** Search queries across 100,000+ lead records must respond in under 200ms.
* **REQ-NFR-02:** Kanban board state transitions and drag-and-drop updates must render optimistically with sub-100ms UI response.
* **REQ-NFR-03:** System must handle concurrent webhook bursts from ad campaigns without dropping lead payloads.

### 4.2 Security & Compliance
* **REQ-NFR-04:** All passwords must be hashed using Argon2id with cryptographically secure salts.
* **REQ-NFR-05:** Authentication must employ short-lived JWT access tokens with rotating refresh tokens stored securely in HTTP-only cookies.
* **REQ-NFR-06:** All API endpoints must enforce role-based access control and organizational tenant scoping.
* **REQ-NFR-07:** Comprehensive audit logging must record all destructive actions, lead reassignments, export operations, and permission changes.

### 4.3 Reliability & Maintainability
* **REQ-NFR-08:** Decoupled architecture using the Repository Pattern and Provider Adapters to isolate business logic from database and third-party API dependencies.
* **REQ-NFR-09:** Database migrations must be atomic, reversible, and version-controlled.
