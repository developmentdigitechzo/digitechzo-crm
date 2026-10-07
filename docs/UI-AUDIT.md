# DigiTechzo CRM — Comprehensive UI Audit & Redesign Specification

> **STATUS:** AUDIT COMPLETE — AWAITING STAKEHOLDER APPROVAL  
> **Phase:** Step A — Screen-by-Screen UI Audit  
> **Target Standard:** Modern, information-dense, high-contrast, brand-consistent CRM (DigiTechzo Growth Green `#57B71B` + Dark Charcoal `#16181B` + Manrope font).

---

## 1. Application Shell & Global Navigation (Sidebar & Header)

### Current State:
- Dark sidebar (`#0B1020`) with 10 nav links, active state using generic blue `#2563EB`, and a mock user role selector at the bottom.
- Top bar with global search, overdue alert pill, notifications, and user avatar.

### Audit Checklist:
* **KEEP:**
  - Compact sidebar layout and collapsible mobile drawer.
  - Role-aware navigation links (Dashboard, Leads, Pipeline, Tasks, Activities, Meetings, Proposals, Customers, Team, Settings).
  - Quick mock user switcher (essential for role testing).
  - Top header with search, notifications, and user profile menu.
* **REMOVE:**
  - Generic blue (`#2563EB`) active highlights and badges.
  - Redundant status banners if the dashboard already communicates overdue tasks clearly.
* **FIX:**
  - **Brand Alignment:** Switch sidebar dark background to DigiTechzo Dark Charcoal `#16181B` and active route accent to DigiTechzo Growth Green `#57B71B`.
  - **Typography:** Apply `Manrope` font across all sidebar items and headers.
  - **Role Scoping:** Show only relevant modules for the logged-in role (e.g. hide Team/Settings for standard BDEs, or mark restricted).
* **WHY:** Enforces visual consistency with `digitechzo.com` brand colors and ensures a clean, distraction-free workspace navigation.

---

## 2. Screen: Login (`/login`)

### Current State:
- Centered card on dark background with Email/Password fields and mock user switcher buttons.

### Audit Checklist:
* **KEEP:**
  - Centered card structure and minimal form fields (Email, Password, Sign in).
  - Quick mock role selector for testing.
* **REMOVE:**
  - Any remaining verbose descriptions or generic blue accent buttons.
* **FIX:**
  - Update primary CTA button to DigiTechzo Growth Green `#57B71B` (hover: `#469815`).
  - Integrate official DigiTechzo favicon/brand logo icon mark.
  - Update background to `#16181B` with subtle dark surface `#202428` card.
* **WHY:** First impression must reflect the real DigiTechzo technology brand identity immediately.

---

## 3. Screen: Dashboard (`/dashboard`)

### Current State:
- "Dashboard" header, 4 KPI cards (Overdue, Follow-ups, Hot Leads, Pipeline), Priority Follow-ups queue, Recent Leads, Pipeline Summary, and Recent Activity stream.

### Audit Checklist:
* **KEEP:**
  - "Today's Work" focus: Overdue follow-ups, pending calls today, hot leads, and active pipeline total.
  - Priority follow-up queue with 1-click outcome logging trigger.
  - Compact recent leads list with Next Action visibility.
  - Pipeline summary breakdown by stage.
* **REMOVE:**
  - Any non-actionable cards or unnecessary metrics.
* **FIX:**
  - **Color Tokens:** Switch KPI accent pills from generic blue to DigiTechzo Growth Green `#57B71B`, Danger `#DC2626`, and Warning `#D97706`.
  - **Role Views:** Add clear visual toggle/separation between **BDE Operational Queue** (Action items, today's calls, hot leads) and **Management Executive Summary** (Conversion funnel, revenue, lost reasons).
  - **Actionability:** Ensure every row has a direct, visible next step (Call, Message, Mark Complete).
* **WHY:** The dashboard is the daily operational cockpit. It must answer "What should I do right now?" in under 5 seconds without visual noise.

---

## 4. Screen: Leads (`/leads`)

### Current State:
- Header with total count (`4 total`), search bar, source filter, and table showing Lead, Contact, Source, Status, Service, Owner, Next Action, and Action.

### Audit Checklist:
* **KEEP:**
  - Concise header ("Leads" + count pill + Add Lead CTA).
  - Search and filter bar.
  - High-density table columns with Next Action purpose and due date highlighted.
  - Soft status badges (Hot, Warm, Cold).
* **REMOVE:**
  - Generic blue export/filter styling.
* **FIX:**
  - **Status Tokens:** Standardize Hot (`#DC2626`), Warm (`#D97706`), Cold (`#57B71B`/`#2563EB`), Won (`#16A34A`).
  - **Table Typography:** Enable tabular numbers for dates/phone numbers and apply `Manrope` font weights.
  - **Quick Filters:** Add quick filter tabs (`All Leads`, `Hot Leads`, `Overdue Follow-up`, `New Inbound`).
* **WHY:** Leads table is the core prospecting list; reps need instant filtering and zero visual clutter.

---

## 5. Screen: Pipeline (`/pipeline`)

### Current State:
- Kanban board with stage columns (`New Lead`, `Qualification`, `Meeting / Demo`, `Proposal Sent`, `Negotiation`, `Closed-Won`), deal cards with amount, win probability, and owner.

### Audit Checklist:
* **KEEP:**
  - Visual Kanban columns with stage total monetary value and deal counts.
  - Compact deal cards displaying title, company, amount, win probability, and expected closing date.
* **REMOVE:**
  - Heavy background colors on column headers.
* **FIX:**
  - **Color Tokens:** Update stage badges and deal values with brand neutral/green palette.
  - **Overdue Indicator:** Add visual overdue dot / badge on deal cards where the next action date has passed.
  - **Card Padding & Radius:** Standardize card padding (`p-3`) and radius (`10px`).
* **WHY:** Kanban boards require maximum horizontal space and high contrast so reps can scan 30+ deals effortlessly.

---

## 6. Screen: Tasks & Work Queue (`/tasks`)

### Current State:
- Card with divide-y list of scheduled tasks with action type icons (Call, WhatsApp, Meeting), status badges, and outcome logging buttons.

### Audit Checklist:
* **KEEP:**
  - Task action type icons (Phone, WhatsApp, Meeting).
  - Priority and status badges.
  - "Log Outcome" quick action button.
* **REMOVE:**
  - Wordy headers or empty helper boxes.
* **FIX:**
  - **Queue Categorization:** Add quick queue filter pills (`Overdue (1)`, `Pending Calls (3)`, `Demos Today (1)`, `All Tasks`).
  - **Outcome Trigger:** Ensure clicking "Log Outcome" opens an accessible outcome modal mock.
* **WHY:** Powers the mandatory "Next Action" system mandated by DigiTechzo sales business rules.

---

## 7. Screen: Activities & Timeline (`/activities`)

### Current State:
- Chronological list of logged calls, WhatsApp messages, and stage transitions.

### Audit Checklist:
* **KEEP:**
  - Chronological touchpoint feed with timestamp and author name.
  - Action-type icon badges.
* **REMOVE:**
  - Generic blue accents on stage change icons.
* **FIX:**
  - **Visual Timeline Thread:** Add subtle vertical connector line between timeline events.
  - **Call Duration Display:** Display call duration and recording status tag clearly.
* **WHY:** Gives managers and reps a single consolidated historical narrative per client inquiry.

---

## 8. Screen: Meetings & Demos (`/meetings`)

### Current State:
- Grid of demo cards with date, time, lead name, Google Meet link, and attendance button.

### Audit Checklist:
* **KEEP:**
  - Upcoming demo cards with direct Google Meet URL slot.
  - Host assignment and attendance tracking button.
* **REMOVE:**
  - Oversized borders and unused white space.
* **FIX:**
  - **Brand Badge:** Use Secondary Tech Accent (`#7C3AED` / `#F5F3FF`) for demo badges.
  - **Compact Layout:** Standardize card layout to match the design system card token.
* **WHY:** Ensures scheduled technical discovery demos have immediate access to video links and outcome recording.

---

## 9. Screen: Proposals (`/proposals`)

### Current State:
- Quotation table with Quote #, Client & Deal, Version (v2 Revised), Total Quoted, Status, and Actions.

### Audit Checklist:
* **KEEP:**
  - Clean quotation number tracking (`DTZ-2026-Q104`), versioning badge (`v2`), and PDF preview/download actions.
* **REMOVE:**
  - Unused columns.
* **FIX:**
  - **Currency Alignment:** Right-align numerical quotation amounts with bold typography.
  - **Status Tokens:** Standardize `Under Review` (Warning), `Accepted` (Success), `Declined` (Danger).
* **WHY:** Provides commercial deal clarity and quotation revision auditability.

---

## 10. Screen: Customers (`/customers`)

### Current State:
- Table of converted accounts with Company, Account Manager, Purchased Services, Realized Revenue, and Status.

### Audit Checklist:
* **KEEP:**
  - Converted customer profiles and realized revenue tracking in green (`#16A34A`).
  - "Account 360" action button.
* **REMOVE:**
  - Non-essential fields.
* **FIX:**
  - Add contract renewal / AMC indicator tag.
* **WHY:** Supports post-sale delivery handoff and long-term customer retention.

---

## 11. Screen: Team (`/team`)

### Current State:
- User directory with avatars, roles (Admin, Sales Manager, BDE), team assignments, and data visibility scope indicators.

### Audit Checklist:
* **KEEP:**
  - Role badges (`ADMIN` Danger, `SALES_MANAGER` Warning, `BDE` Primary/Info).
  - Clear "Data Scope" explanation column (All Records vs. Team Records vs. Assigned Only).
* **REMOVE:**
  - Generic styling.
* **FIX:**
  - Update primary CTA to "Invite User" in DigiTechzo Growth Green `#57B71B`.
* **WHY:** Enforces RBAC visibility rules across the organization.

---

## 12. Screen: Settings (`/settings`)

### Current State:
- Cards for Sales Pipeline Stages and Integration Adapters status.

### Audit Checklist:
* **KEEP:**
  - Pipeline stage list summary and provider adapter status indicators (WhatsApp, Telephony, Storage marked `TBD`).
* **REMOVE:**
  - Any placeholder buttons that imply unimplemented backend configurations.
* **FIX:**
  - Clean card borders and tokenized badges.
* **WHY:** Gives administrators transparency over CRM configuration and adapter states.

---

## 13. Summary of Core Changes for Step B / Step C Approval

1. **Brand Identity Transformation:** Replace generic blues with DigiTechzo Corporate Brand Green (`#57B71B`), Dark Charcoal (`#16181B`), and `Manrope` typography.
2. **Zero Dead Code / Wordiness:** Strip all remaining marketing descriptions; use concise operational labels only.
3. **Information Density & Contrast:** 100% WCAG AA contrast compliance across all text, status badges, and table rows.
4. **Strict Scope Control:** Zero changes to backend, APIs, database, or business logic.
