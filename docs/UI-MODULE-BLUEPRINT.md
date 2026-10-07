# DigiTechzo CRM — Module-by-Module UI/UX Blueprint

> **STATUS:** SPECIFICATION / BLUEPRINT  
> **Version:** 1.0.0  
> **Source Documents:** [`docs/REQUIREMENTS.md`](file:///c:/DigiTechzo%20CRM/docs/REQUIREMENTS.md), [`docs/MVP-SCOPE.md`](file:///c:/DigiTechzo%20CRM/docs/MVP-SCOPE.md), [`docs/CRM-MODULES.md`](file:///c:/DigiTechzo%20CRM/docs/CRM-MODULES.md), [`docs/BUSINESS-RULES.md`](file:///c:/DigiTechzo%20CRM/docs/BUSINESS-RULES.md), [`docs/FRONTEND-ARCHITECTURE.md`](file:///c:/DigiTechzo%20CRM/docs/FRONTEND-ARCHITECTURE.md), [`docs/AUTH-RBAC.md`](file:///c:/DigiTechzo%20CRM/docs/AUTH-RBAC.md)  
> **Visual Foundation:** [`docs/UI-DESIGN-SYSTEM.md`](file:///c:/DigiTechzo%20CRM/docs/UI-DESIGN-SYSTEM.md)  

---

## 1. Sidebar Information Architecture & Navigation Strategy

### 1.1 Structural Principle: Standalone vs. Contextual Placement
To prevent cognitive overload, navigation bloat, and fragmented workflows, features are partitioned between **Standalone Navigation** (top-level routing) and **Contextual Sections** (embedded inside parent record detail drawers/tabs):

- **Standalone Modules:** High-frequency, primary operational views accessed multiple times per hour across all records (Dashboard, Leads, Pipeline, Tasks, Activities, Meetings, Proposals, Customers, Team, Settings).
- **Contextual Sections:** Capabilities that only make sense within the context of a specific prospect, opportunity, or client account:
  - **Lead Qualification (BANT):** Evaluated strictly as a **Contextual Drawer / Tab inside Lead Detail** (`/leads/:id`). BANT scores evaluate specific leads, not isolated abstract entities.
  - **Deals & Payment Milestones:** Tracked **contextually inside Pipeline Deals & Customer Profiles**, with high-level pipeline rollups on the Kanban board.
  - **Calls / Telephony & Call Recordings:** Initiated via click-to-call on Lead/Customer rows; call logs and audio recordings appear **contextually in the Chronological Activity Stream** (`/activities` or embedded timeline).
  - **WhatsApp Threads:** Initiated via click-to-message; conversation histories appear **contextually in the Activity Stream / Lead Drawer**.

### 1.2 Proposed Global Sidebar Hierarchy

```
[Brand Header: DigiTechzo Logo + CRM Pill + Collapse Button]

OVERVIEW
├── Dashboard (/dashboard)                     [P0]

SALES EXECUTION
├── Leads (/leads)                             [P0] (Contains: Import, Create, Lead Detail Drawer)
├── Pipeline (/pipeline)                       [P0] (Kanban Deals & Stage Progress)
└── Tasks (/tasks)                             [P0] (Daily Action Queue & Follow-ups)

ENGAGEMENT & COMMERCIALS
├── Activities (/activities)                   [P1] (Calls, Messages, Stage History, Audio Logs)
├── Meetings (/meetings)                       [P1] (Demos & Technical Discovery)
└── Proposals (/proposals)                     [P1] (Quotations, PDFs, Revisions)

ACCOUNTS & PERFORMANCE
├── Customers (/customers)                     [P0/P1] (Won Accounts, Retainers, Handoffs)
└── Reports (/reports)                         [P0/P1] (Manager Funnel & BDE Leaderboard)

ADMINISTRATION
├── Team (/team)                               [P0] (User Directory, RBAC Roles)
└── Settings (/settings)                       [P0] (Taxonomies, Lead Sources, Stage Config)

[User Profile Menu & Development Role Switcher]
```

---

## 2. Module Specifications

---

### Module A: Dashboard

* **Purpose:** Operational sales cockpit providing immediate visibility into urgent tasks, pending calls, active pipeline health, and hot opportunities.
* **Primary User:** BDE / Sales Representative (Default View) & Sales Manager (Aggregated View).
* **Primary Action:** `Add Lead` (CTA) / `Log Outcome` (in-row action).
* **Traceable Requirements:** `REQ-DASH-01`, `docs/CRM-MODULES.md` Section 12, `docs/BUSINESS-RULES.md` Rule `BR-FOL-01`.
* **Page Header:**
  - Title: `Dashboard`
  - Subtitle: `"Your sales activity and priority queue at a glance"`
  - User/Role Context: `[FirstName] ([Role])` pill.
  - Header Actions: `Pipeline` (outline button) and `+ Add Lead` (primary brand green button).
* **Main Content Structure:**
  1. **KPI Metric Row (4 compact cards):**
     - Overdue Follow-ups (Count, red danger state, "Action required").
     - Follow-ups Due (Count, amber pending state, "Pending today").
     - Hot Leads (Count, amber flame state, "High budget & intent").
     - Active Pipeline (Total formatted currency, count of active deals).
  2. **Main 2-Column Operational Grid (7 cols / 5 cols desktop):**
     - Left (7 cols):
       - `Priority Follow-ups` card list with action icons, titles, lead names, status badges, due times, and `Log` CTA.
       - `Recent Leads` card list with full name, hot/warm badges, company, service interest, and next action pill.
     - Right (5 cols):
       - `Pipeline Snapshot` card list with active stage progress bars, deal counts, and stage totals.
       - `Recent Sales Activity` timeline with icon, title, description, and timestamp.
* **Required Data:** `MOCK_TASKS`, `MOCK_LEADS`, `MOCK_PIPELINE_STAGES`, `MOCK_ACTIVITIES`.
* **Filters:** Quick category links to `/tasks`, `/leads`, `/pipeline`, `/activities`.
* **Mobile Behavior (390px):**
  - KPI cards stack to 2-column compact grid with tabular numbers.
  - 2-column operational grid stacks vertically (Priority Follow-ups $\rightarrow$ Recent Leads $\rightarrow$ Pipeline Snapshot $\rightarrow$ Recent Activity).
  - Touch targets $\ge 44\text{px}$. Zero horizontal scrolling.
* **Text to Remove/Avoid:** Remove verbose descriptive paragraphs ("Here is your daily overview..."). No decorative marketing illustrations.

---

### Module B: Leads

* **Purpose:** Central tabular directory for cataloging, searching, deduplicating, and managing inbound and outbound prospect records.
* **Primary User:** BDEs, Sales Managers, Marketing Executives.
* **Primary Action:** `+ Add Lead` (Modal trigger) / `Import Leads` (CSV wizard).
* **Traceable Requirements:** `REQ-LEAD-01` to `REQ-LEAD-08`, `docs/CRM-MODULES.md` Section 1, `docs/BUSINESS-RULES.md` `BR-OWN-01`, `BR-DEDUP-01`.
* **Page Header:**
  - Title: `Leads`
  - Count Pill: Total lead count (e.g., `124 leads`).
  - Subtitle: `"Prospective client inquiries and qualified contacts"`
  - Header Actions: `Import CSV` (outline button) and `+ Add Lead` (brand green button).
* **Main Content Structure:**
  1. **Filter & Search Bar:**
     - Left: Search input (`"Search by name, company, phone, email..."`).
     - Right: Filter controls (Source dropdown, Status pills: `All`, `Hot`, `Warm`, `Cold`, `Unqualified`, Owner filter).
  2. **Data Table (High-Density):**
     - Columns:
       - Contact Name & Title (`font-bold text-xs text-[#1E242B]`, email/phone underneath).
       - Company & Service Line (`text-xs text-[#4A5568]`).
       - Source (`META_ADS`, `GOOGLE_ADS`, `WEBSITE_FORM`, etc. in subtle badges).
       - Status (`Hot`, `Warm`, `Cold`, `Unqualified` via `StatusBadge`).
       - Lead Score (Tabular progress indicator or score badge, e.g., `88/100`).
       - Next Scheduled Action (Action type, due date/time, or red "Missing Next Action" alert).
       - Owner (Avatar initials + BDE name).
       - Actions: Quick call trigger, edit trigger, view detail drawer.
  3. **Table Footer / Pagination:** Total record count, page size selector (25, 50, 100), page navigation controls.
* **Required Data:** `Lead` entity fields: `id`, `fullName`, `companyName`, `title`, `phone`, `email`, `source`, `status`, `leadScore`, `serviceInterest`, `ownerName`, `nextAction`.
* **Secondary Actions:** Bulk owner reassignment, CSV export (Manager/Admin only), Lead merge (on duplicate detection).
* **Mobile Behavior (390px):**
  - Table transforms into compact stacked cards displaying: Contact Name, Status Badge, Company, Next Action pill, and phone call trigger.
* **Information NOT to Show:** Do not display raw database IDs, UTM parameters, or full audit logs on the main table (relegated to detail drawer).

---

### Module C: Lead Detail View

* **Purpose:** Comprehensive 360-degree prospect dossier providing full interaction history, qualification data, linked deals, and next-action enforcement.
* **Primary User:** Assigned BDE, Sales Manager.
* **Primary Action:** `Log Interaction & Set Next Action` (Rule `BR-ACT-01`).
* **Traceable Requirements:** `REQ-LEAD-05`, `docs/CRM-MODULES.md` Section 1 & 5, `docs/BUSINESS-RULES.md` `BR-ACT-01`.
* **Presentation Format:** Slide-out right drawer (480px–560px on desktop) or full page (`/leads/:id`) on mobile.
* **Main Content Structure:**
  1. **Dossier Header:**
     - Prospect full name, company name, primary phone with click-to-call, WhatsApp quick launch button.
     - Status badge (`Hot`, `Warm`, `Cold`) + Lead Score pill.
     - Lead Owner selector (reassignable by Manager).
  2. **Mandatory Next Action Banner (Rule `BR-ACT-01`):**
     - Visual high-contrast banner showing scheduled next action (e.g., `Meeting: Technical Demo on 6 Oct, 11:30 AM`).
     - If missing: High-visibility amber warning with `+ Schedule Next Action` button.
  3. **Tabbed Content Sections:**
     - **Tab 1: Overview:** Contact details, secondary phone, company address, service interest, UTM attribution source.
     - **Tab 2: Qualification (BANT):** Structured qualification summary (see Module D).
     - **Tab 3: Activity Timeline:** Chronological stream of calls, WhatsApp chats, notes, and stage changes.
     - **Tab 4: Deals & Proposals:** Opportunities created from this lead, quotation documents, contract status.
     - **Tab 5: Tasks:** Pending and completed follow-up items linked to this lead.
* **Required Data:** Full `Lead` entity, `TaskItem[]`, `ActivityItem[]`, `Deal[]`, `Proposal[]`.
* **Mobile Behavior:** Full-screen modal with fixed bottom action bar (`Call`, `WhatsApp`, `Log Activity`).

---

### Module D: Lead Qualification (BANT)

* **Purpose:** Enforces structured BANT evaluation before allowing a lead to advance into the active sales pipeline (Rule `BR-QUAL-01`).
* **Primary User:** Assigned BDE, Sales Manager.
* **Primary Action:** `Save Qualification & Calculate Score`.
* **Traceable Requirements:** `REQ-QUAL-01` to `REQ-QUAL-05`, `docs/CRM-MODULES.md` Section 2, `docs/BUSINESS-RULES.md` `BR-QUAL-01`, `BR-QUAL-02`.
* **Placement:** Dedicated tab within the Lead Detail View / Drawer (Module C) and Modal triggered during pipeline stage advancement.
* **Main Content Structure:**
  1. **BANT Evaluation Form:**
     - **Need / Problem Statement:** Structured text area detailing technical or marketing requirements.
     - **Budget Range & Readiness:** Formatted currency range, toggle: "Budget Confirmed" vs. "Exploratory / Unclear".
     - **Authority / Decision-Maker Role:** Select: `Direct Decision Maker (Founder/CXO)`, `Technical Evaluator / Lead`, `Influencer / End-User`.
     - **Timeline / Urgency:** Select: `< 2 Weeks (Immediate)`, `1 Month`, `1–3 Months`, `Exploring / Unknown`.
  2. **Computed Lead Score Display:**
     - Visual score card (0–100) with color indicator (Green $\ge 75$, Amber 50–74, Slate $<50$).
  3. **Categorization & Unqualification Controls:**
     - Status selector: `Hot`, `Warm`, `Cold`, `Unqualified`.
     - *If Unqualified selected:* Mandatory dropdown for reason code (Rule `BR-QUAL-03`: `Invalid Contact`, `No Budget`, `Student / Job Seeker`, `Competitor`, `Out of Scope`) + required notes.
* **Required Data:** `problemStatement`, `budgetRange`, `budgetReadiness`, `decisionMakerRole`, `timeline`, `leadScore`, `qualificationNotes`.
* **Information NOT to Show:** Do not expose raw internal algorithmic weighting coefficients to end users.

---

### Module E: Sales Pipeline & Deals

* **Purpose:** Interactive visual Kanban board and spreadsheet list for tracking deals through qualification, demo, proposal, negotiation, and closing.
* **Primary User:** BDEs, Sales Managers, Leadership.
* **Primary Action:** Drag deal to advance stage / `+ Create Deal`.
* **Traceable Requirements:** `REQ-PIPE-01` to `REQ-PIPE-07`, `docs/CRM-MODULES.md` Section 3, `docs/BUSINESS-RULES.md` `BR-PIPE-01`, `BR-PIPE-02`, `BR-PIPE-03`.
* **Page Header:**
  - Title: `Pipeline`
  - Subtitle: `"Active sales opportunities and revenue stages"`
  - Total Pipeline Metric: Total open value (`₹99,50,000`) and deal count (`28 deals`).
  - Controls: View switcher (`Kanban` vs. `Table`), Filter button, `+ New Deal` CTA.
* **Main Content Structure:**
  1. **Stage Filter & Search Bar:**
     - BDE owner filter, Service line filter, Date range filter.
  2. **Kanban Board Columns (Horizontal Scrolling Container):**
     - Approved Stages:
       1. `New Lead` (Open)
       2. `Qualification` (Open)
       3. `Meeting / Demo` (Open)
       4. `Proposal Sent` (Open)
       5. `Negotiation` (Open)
       6. `Closed-Won` (Won — Emerald header highlight)
       7. `Closed-Lost` (Lost — Muted slate header)
     - Column Headers: Stage name, deal count pill, total value in tabular currency.
     - Deal Cards: Deal title, prospect company, deal value in bold rupee format, win probability %, expected close date, owner avatar.
  3. **Mandatory Governance Modals:**
     - **Closed-Lost Reason Modal (Rule `BR-PIPE-02`):** Triggered when dragging to `Closed-Lost`. Requires selecting reason code (`PRICE_TOO_HIGH`, `COMPETITOR_CHOSEN`, `UNRESPONSIVE_GHOSTED`, etc.) and notes.
     - **Closed-Won Validation Modal (Rule `BR-PIPE-03`):** Triggered on `Closed-Won`. Validates total value, advance payment received, and proposal reference.
* **Required Data:** `Deal[]`, `PipelineStage[]`, `LostReason[]`.
* **Mobile Behavior:** Horizontal column swipe with snap points or quick stage switcher dropdown at top.

---

### Module F: Tasks / Follow-ups

* **Purpose:** Sales execution engine organizing all scheduled calls, messages, demos, and follow-ups into prioritized daily work queues.
* **Primary User:** Assigned BDEs, Sales Managers.
* **Primary Action:** `Log Outcome` (in-row action) / `+ Schedule Task`.
* **Traceable Requirements:** `REQ-FOL-01` to `REQ-FOL-05`, `docs/CRM-MODULES.md` Section 4 & 10, `docs/BUSINESS-RULES.md` `BR-FOL-01`.
* **Page Header:**
  - Title: `Tasks`
  - Count Pill: `${MOCK_TASKS.length} active`
  - Subtitle: `"Your follow-ups and scheduled actions"`
  - Header Actions: `Filter` button and `+ Schedule Task` brand green button.
* **Main Content Structure:**
  1. **Overdue Action Alert Banner (Rule `BR-FOL-01`):**
     - Rendered if overdue tasks exist (`bg-[#FEF2F2] border border-rose-200`). Shows count of overdue follow-ups with `View Overdue` button.
  2. **Metric Summary Cards (3 cards):**
     - Total Active, Overdue (red), Due Today / Pending (amber). Serves as 1-click filter toggle.
  3. **Category Filter Pills:**
     - `All`, `Overdue`, `Calls`, `WhatsApp`, `Meetings`.
  4. **Main Action Queue Card List:**
     - Task type icon badge (`CALL` in green, `WHATSAPP` in emerald, `MEETING` in purple).
     - Task title, Status badge (`OVERDUE`, `PENDING`), Priority badge (`URGENT`, `HIGH`, `MEDIUM`).
     - Prospect name & company with `Building2` icon, Assigned owner with `User` icon.
     - Due time/date with tabular formatting.
     - `Log Outcome` CTA button linking directly to activity logger.
* **Required Data:** `TaskItem[]`.
* **Mobile Behavior:** Stacked card format with touch-friendly `Log Outcome` button, zero horizontal scroll.

---

### Module G: Activities / Communication History

* **Purpose:** Unified chronological audit log tracking every prospect touchpoint across phone calls, WhatsApp messages, emails, meetings, and internal notes.
* **Primary User:** BDEs, Sales Managers, Delivery Leads.
* **Primary Action:** `+ Log Interaction`.
* **Traceable Requirements:** `REQ-COMM-01` to `REQ-COMM-04`, `docs/CRM-MODULES.md` Section 5.
* **Page Header:**
  - Title: `Activities`
  - Subtitle: `"Unified interaction history and customer communications"`
  - Header Actions: `Filter by Type` dropdown and `+ Log Activity` CTA.
* **Main Content Structure:**
  1. **Activity Type Filter Bar:**
     - Pills: `All`, `Calls`, `WhatsApp`, `Meetings`, `Proposals`, `Stage Changes`, `Notes`.
  2. **Chronological Timeline Feed:**
     - Left: Date separator line with activity type icons.
     - Center Card:
       - Header: Activity title (e.g., `Outbound Call Connected (12m 40s)`), prospect name, company.
       - Body: Notes, call summary, or message transcript.
       - Audio Player (Contextual for recorded calls): Compact inline audio scrub bar (Play/Pause, duration, waveform).
       - Author: Name of user who logged the activity + exact timestamp.
* **Required Data:** `ActivityItem[]` with `metadataJson` (`callDuration`, `recordingUrl`, `messageId`).
* **Mobile Behavior:** Vertical timeline line with compact event cards.

---

### Module H: Meetings & Demos

* **Purpose:** Schedules, manages, and records attendance and technical outcomes for client product demonstrations and discovery sessions.
* **Primary User:** BDEs, Solutions Architects, Sales Managers.
* **Primary Action:** `+ Schedule Demo`.
* **Traceable Requirements:** `REQ-DEMO-01` to `REQ-DEMO-04`, `docs/CRM-MODULES.md` Section 6.
* **Page Header:**
  - Title: `Meetings & Demos`
  - Subtitle: `"Client discovery sessions, technical demos, and review meetings"`
  - Header Actions: `Calendar View` toggle and `+ Schedule Demo` CTA.
* **Main Content Structure:**
  1. **Demo Status Filter Tabs:**
     - `Upcoming`, `Completed`, `Rescheduled`, `No-Show`.
  2. **Meetings Table / Card List:**
     - Meeting Title & Purpose (e.g., `B2B Wholesale Portal Architecture Demo`).
     - Prospect Name & Company.
     - Host / Solution Architect.
     - Scheduled Date & Time with calendar icon.
     - Meeting Link: Clickable Google Meet / Zoom link badge (`Join Meeting` in tech purple).
     - Attendance Status Badge (`Scheduled`, `Completed`, `No-Show`).
     - In-Row Action: `Log Outcome` (records technical feedback and next steps).
* **Required Data:** `meetingId`, `leadId`, `dealId`, `title`, `hostUserId`, `startTime`, `endTime`, `meetingUrl`, `status`, `outcomeSummary`.
* **Mobile Behavior:** Card view with direct tap-to-join meeting URL button.

---

### Module I: Proposals & Quotations

* **Purpose:** Manages the generation, versioning, document attachment, and commercial review of sales quotations and proposals.
* **Primary User:** BDEs, Sales Managers, Delivery Leads.
* **Primary Action:** `+ Create Proposal`.
* **Traceable Requirements:** `REQ-PROP-01` to `REQ-PROP-05`, `docs/CRM-MODULES.md` Section 7.
* **Page Header:**
  - Title: `Proposals`
  - Subtitle: `"Quotations, commercial proposals, and revision tracking"`
  - Header Actions: `Status Filter` and `+ Create Proposal` CTA.
* **Main Content Structure:**
  1. **Proposal Directory Table:**
     - Quotation Reference Number (e.g., `DZ-QT-2026-084`).
     - Client Company & Deal Name.
     - Version Pill (`v1`, `v2`, `v3`).
     - Total Value & Discount Amount (formatted in tabular rupees).
     - Status Badge (`Draft`, `Sent`, `Under Review`, `Accepted`, `Declined`).
     - Valid Until Date.
     - Actions: `View PDF` preview trigger, `Create Revision` trigger.
  2. **Proposal PDF Preview Drawer:**
     - Side drawer embedding PDF document viewer, version comparison toggle, and client acceptance logger.
* **Required Data:** `proposalId`, `dealId`, `quotationNumber`, `versionNumber`, `totalAmount`, `discountAmount`, `status`, `fileUrl`, `validUntil`.
* **Mobile Behavior:** Table converts into document cards with direct `Download PDF` action.

---

### Module J: Deals & Payment Milestones

* **Purpose:** Tracks commercial contract terms, payment milestones, advance amounts received, and revenue realization upon deal closure.
* **Primary User:** Sales Managers, BDEs, Finance / Delivery Leads.
* **Primary Action:** `Record Payment`.
* **Traceable Requirements:** `REQ-DEAL-01`, `docs/CRM-MODULES.md` Section 8, `docs/BUSINESS-RULES.md` `BR-PIPE-03`.
* **Placement:** Standalone directory under Accounts (`/deals`) and contextual tab within Customer 360 profile.
* **Main Content Structure:**
  1. **Payment Summary Cards:**
     - Realized Revenue (Received), Pending Milestones, Overdue Payments.
  2. **Milestone Tracker Table:**
     - Deal / Contract Name & Client Company.
     - Payment Type: `ADVANCE`, `MILESTONE`, `FULL_PAYMENT`.
     - Amount Due & Amount Received.
     - Due Date / Payment Date.
     - Payment Method (`Bank Transfer`, `UPI`, `Card`) & Transaction Reference.
     - Status Badge: `RECEIVED` (Green), `PENDING` (Amber), `OVERDUE` (Red).
* **Required Data:** `paymentId`, `dealId`, `customerId`, `amount`, `paymentDate`, `paymentMethod`, `transactionReference`, `status`.

---

### Module K: Customer Management

* **Purpose:** Maintains long-term customer records converted from won leads, tracking purchased services, active retainers, contracts, and retention touchpoints.
* **Primary User:** Account Managers, Delivery Leads, BDEs, Management.
* **Primary Action:** `+ Add Customer` / `Convert Won Deal`.
* **Traceable Requirements:** `REQ-CUST-01` to `REQ-CUST-04`, `docs/CRM-MODULES.md` Section 9.
* **Page Header:**
  - Title: `Customers`
  - Subtitle: `"Active client accounts, contracts, and retainer renewals"`
  - Header Actions: `Status Filter` and `Export Accounts`.
* **Main Content Structure:**
  1. **Customer Directory Table:**
     - Organization Name & Industry.
     - Primary Contact Name, Email, and Phone.
     - Active Services / Retainers (e.g., `SEO Retainer`, `Custom Web App`).
     - Assigned Account Manager.
     - Contract Period & Renewal Date.
     - Account Status: `ACTIVE` (Green), `INACTIVE` (Slate), `CHURNED` (Red).
  2. **Customer 360 Profile (Drawer/Page):**
     - Organization overview, multi-stakeholder directory, historical deals, active billing milestones, and communication timeline.
* **Required Data:** `customerId`, `companyName`, `industry`, `primaryContactName`, `accountManagerUserId`, `status`, `contractEndDate`.

---

### Module L: Team & RBAC Permissions

* **Purpose:** Manages organization users, sales teams, hierarchical reporting, role-based authorization, and data visibility rules.
* **Primary User:** Super Admins, Sales Managers.
* **Primary Action:** `+ Invite Team Member`.
* **Traceable Requirements:** `REQ-TEAM-01` to `REQ-TEAM-05`, `docs/CRM-MODULES.md` Section 11, `docs/AUTH-RBAC.md`.
* **Page Header:**
  - Title: `Team`
  - Subtitle: `"Organization members, sales teams, and role-based permissions"`
  - Header Actions: `+ Invite Member` (brand green button).
* **Main Content Structure:**
  1. **Team Filter Tabs:** `All Members`, `Inbound Sales`, `Outbound Sales`, `Delivery`, `Admins`.
  2. **User Directory Table:**
     - Member Name & Avatar (with email underneath).
     - Role Badge: `ADMIN` (Dark), `SALES_MANAGER` (Purple), `BDE` (Green), `MARKETING` (Blue), `DELIVERY` (Slate).
     - Assigned Team (e.g., `Inbound Growth Team`).
     - Active Lead Count & Open Pipeline Deals.
     - Status: `ACTIVE` (Green dot), `INACTIVE` (Slate dot).
     - In-Row Action: Edit role, reassign leads, deactivate account.
* **Required Data:** `userId`, `firstName`, `lastName`, `email`, `role`, `teamName`, `isActive`.
* **RBAC Restrictions:** BDEs have Read-Only or Hidden view of this page; full management is restricted to `Admin` and `Sales Manager`.

---

### Module M: Reports & Executive Analytics

* **Purpose:** Aggregates transactional CRM data into conversion funnels, pipeline velocity, BDE performance leaderboards, and campaign source ROI.
* **Primary User:** Sales Managers, Executive Leadership.
* **Primary Action:** `Export Report (CSV/PDF)`.
* **Traceable Requirements:** `REQ-REP-01` to `REQ-REP-05`, `docs/CRM-MODULES.md` Section 12, `docs/MVP-SCOPE.md` Section 2.
* **Page Header:**
  - Title: `Reports`
  - Subtitle: `"Executive sales performance, funnel velocity, and revenue analytics"`
  - Header Actions: Date Range Selector (`This Month`, `Quarter to Date`, `Year to Date`, `Custom`) and `Export`.
* **Main Content Structure:**
  1. **Executive Metric Cards:** Total Revenue Won, Pipeline Coverage Ratio, Average Deal Size, Lead-to-Won Conversion Rate %.
  2. **Funnel Conversion Velocity Chart/Table:** Stage-by-stage drop-off rates from New Lead $\rightarrow$ Qualified $\rightarrow$ Demo $\rightarrow$ Proposal $\rightarrow$ Won.
  3. **BDE Performance Leaderboard:** Rep name, leads handled, follow-ups completed, demos conducted, revenue closed, win rate %.
  4. **Source & Campaign ROI Table:** Source (`Meta Ads`, `Google Ads`, `Website`, `WhatsApp`), leads generated, qualified leads, CAC, won revenue.
* **Required Data:** Aggregated query outputs over `Lead`, `Deal`, `Task`, `Activity`, and `StageHistory`.

---

### Module N: Calls & Telephony (P1 / P2)

* **Purpose:** Click-to-call execution, telephony session tracking, call duration measurement, and outcome capture.
* **Primary User:** BDEs, Sales Managers.
* **Primary Action:** `Initiate Call` (Click-to-Call trigger).
* **Traceable Requirements:** `REQ-TEL-01` to `REQ-TEL-04`, `docs/CRM-MODULES.md` Section 5, `docs/MVP-SCOPE.md` Section 3 (Deferred item 6).
* **Placement:** Contextual click-to-call icon on all phone numbers across Lead tables and detail drawers.
* **Main Content Structure:**
  - **In-Call Float Bar / Modal:** Appears upon clicking phone icon. Displays Prospect Name, Company, Call Status (`Connecting...`, `Connected`, `Call Ended`), elapsed timer (`00:04:12`).
  - **Post-Call Outcome Logger Modal:** Triggered immediately when call terminates:
    - Outcome: `Connected / Interested`, `Left Voicemail`, `Busy / No Answer`, `Wrong Number`, `Gatekeeper Refusal`.
    - Call Notes: Textarea for discussion points.
    - Mandatory Next Action: Action type, date, time, and purpose (Rule `BR-ACT-01`).
* **Technical Note:** Initial phase uses `tel:` protocol or external telephony bridge before WebRTC browser softphone (explicitly deferred in `docs/MVP-SCOPE.md`).

---

### Module O: Call Recordings & Audio Logs (P1 / P2)

* **Purpose:** Secure playback and review of customer call audio recordings for quality assurance, compliance, and BDE coaching.
* **Primary User:** Sales Managers, BDEs (Self review).
* **Primary Action:** `Play Audio` / `Review Transcript`.
* **Traceable Requirements:** `REQ-TEL-03`, `docs/CRM-MODULES.md` Section 5, `docs/MVP-SCOPE.md` Section 2.
* **Placement:** Contextual embedded player inside Call Activity items in Module G (`Activities`) and Lead Detail.
* **Main Content Structure:**
  - Compact audio playback widget: Play/Pause button, current time / total duration (`04:32 / 12:40`), scrub bar, volume control, download button (Admin/Manager only).
  - Linked AI Transcript accordion (when AI module P2 is active).
* **Status:** **P1 Contextual Capability** (Manual audio links in P1; automated telephony ingestion in P2).

---

### Module P: WhatsApp Messaging (P1 / P2)

* **Purpose:** Two-way customer communication via WhatsApp Business API, template message dispatch, and chat history auditing.
* **Primary User:** BDEs, Marketing Executives.
* **Primary Action:** `Send WhatsApp Message`.
* **Traceable Requirements:** `REQ-WA-01` to `REQ-WA-04`, `docs/CRM-MODULES.md` Section 5, `docs/MVP-SCOPE.md` Section 2.
* **Placement:** Contextual WhatsApp quick trigger next to prospect phone numbers and dedicated WhatsApp tab within Lead Detail.
* **Main Content Structure:**
  - **Thread View Drawer:** Chat bubble history showing inbound client messages (white bubbles) and outbound BDE replies (green-tinted bubbles `#F0FDF4`).
  - **Template Message Selector:** Approved business template dropdown (e.g., `Initial Inquiry Welcome`, `Meeting Reminder`, `Audit PDF Dispatch`).
  - **Message Composer:** Text area with character counter and attachment uploader.
* **Status:** **P1/P2 Capability** (Manual web link launch `https://wa.me/` in P0/P1; full two-way API webhook thread in P2).

---

### Module Q: Settings & System Configuration

* **Purpose:** Configuration of organizational parameters, lead source channels, service line taxonomies, and sales pipeline stages.
* **Primary User:** Super Admins.
* **Primary Action:** `Save Configuration`.
* **Traceable Requirements:** `REQ-SET-01` to `REQ-SET-05`, `docs/CRM-MODULES.md` Section 11, `docs/BUSINESS-RULES.md`.
* **Page Header:**
  - Title: `Settings`
  - Subtitle: `"System configuration, sales taxonomies, and pipeline customization"`
* **Main Content Structure:**
  - **Vertical Settings Nav:**
    1. **Organization Profile:** Company name, timezone, base currency (`INR`).
    2. **Pipeline Stages:** Drag-and-drop ordering of sales stages, stage probabilities, and stage color tags.
    3. **Lead Sources & UTMs:** Manage active lead channels (`Meta Ads`, `Google Ads`, `Website`, `WhatsApp`).
    4. **Service Lines:** Manage DigiTechzo service taxonomy (`AI Development`, `Web3`, `Custom Web Apps`, `SEO Retainers`).
    5. **Lost Reason Codes:** Standardized reason codes for deal loss governance (Rule `BR-PIPE-02`).
    6. **Audit Logs:** System activity security log table.
* **Required Data:** Organization configuration records.

---

## 3. Requirements Traceability Matrix

| Module | Core Documentation Reference | MVP Priority | Status |
| :--- | :--- | :---: | :--- |
| **A. Dashboard** | `docs/CRM-MODULES.md` §12, `docs/BUSINESS-RULES.md` `BR-FOL-01` | **P0** | Defined & Approved |
| **B. Leads** | `docs/REQUIREMENTS.md` `REQ-LEAD-01..08`, `docs/CRM-MODULES.md` §1 | **P0** | Defined |
| **C. Lead Detail** | `docs/REQUIREMENTS.md` `REQ-LEAD-05`, `docs/BUSINESS-RULES.md` `BR-ACT-01` | **P0** | Defined |
| **D. Qualification** | `docs/REQUIREMENTS.md` `REQ-QUAL-01..05`, `docs/BUSINESS-RULES.md` `BR-QUAL-01` | **P0** | Defined (Contextual) |
| **E. Pipeline** | `docs/REQUIREMENTS.md` `REQ-PIPE-01..07`, `docs/BUSINESS-RULES.md` `BR-PIPE-01..03` | **P0** | Defined |
| **F. Tasks** | `docs/REQUIREMENTS.md` `REQ-FOL-01..05`, `docs/BUSINESS-RULES.md` `BR-FOL-01` | **P0** | Defined & Approved |
| **G. Activities** | `docs/REQUIREMENTS.md` `REQ-COMM-01..04`, `docs/CRM-MODULES.md` §5 | **P1** | Defined |
| **H. Meetings** | `docs/REQUIREMENTS.md` `REQ-DEMO-01..04`, `docs/CRM-MODULES.md` §6 | **P1** | Defined |
| **I. Proposals** | `docs/REQUIREMENTS.md` `REQ-PROP-01..05`, `docs/CRM-MODULES.md` §7 | **P1** | Defined |
| **J. Deals/Payments**| `docs/CRM-MODULES.md` §8, `docs/BUSINESS-RULES.md` `BR-PIPE-03` | **P0/P1**| Defined (Contextual) |
| **K. Customers** | `docs/REQUIREMENTS.md` `REQ-CUST-01..04`, `docs/CRM-MODULES.md` §9 | **P0/P1**| Defined |
| **L. Team** | `docs/REQUIREMENTS.md` `REQ-TEAM-01..05`, `docs/AUTH-RBAC.md` | **P0** | Defined |
| **M. Reports** | `docs/REQUIREMENTS.md` `REQ-REP-01..05`, `docs/CRM-MODULES.md` §12 | **P0/P1**| Defined |
| **N. Telephony** | `docs/CRM-MODULES.md` §5, `docs/MVP-SCOPE.md` §3 Item 6 | **P1/P2**| Defined (Contextual) |
| **O. Audio Logs** | `docs/CRM-MODULES.md` §5 | **P1/P2**| Defined (Contextual) |
| **P. WhatsApp** | `docs/CRM-MODULES.md` §5 | **P1/P2**| Defined (Contextual) |
| **Q. Settings** | `docs/CRM-MODULES.md` §11, `docs/BUSINESS-RULES.md` | **P0** | Defined |

---

## 4. TBD / Open UI Decisions

The following items are recognized as open design decisions requiring explicit owner confirmation before implementation:

1. **Reports Navigation Entry:**
   - *Option A:* Standalone sidebar item `/reports` dedicated to manager analytics.
   - *Option B:* Tab inside `/dashboard` switching between "My Daily Work" (BDE) and "Executive Analytics" (Manager).
   - *Recommendation:* Standalone `/reports` in sidebar to maintain clean separation between operational daily tasks and strategic reporting.
2. **Deals & Milestones Screen Scope:**
   - *Option A:* Standalone `/deals` table in the sidebar.
   - *Option B:* Integrated strictly inside `/pipeline` (toggle between Kanban and Table) and inside `/customers/:id`.
   - *Recommendation:* Integrate inside `/pipeline` via view switcher (Kanban vs Table) to avoid redundant navigation.
3. **Telephony Click-to-Call Behavior:**
   - *P0/P1 Behavior:* Use OS standard `tel:+91...` protocol or redirect to external dialer.
   - *P2 Behavior:* Embedded floating softphone panel with live timer and in-browser call recording playback.
