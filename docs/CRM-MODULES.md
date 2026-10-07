# DigiTechzo CRM — Module Specifications

> **STATUS:** SPECIFICATION / PLANNING  
> **Version:** 1.0.0  
> **Baseline:** System Modules, User Roles, Screen Hierarchy, and Dependencies

---

## Module Index

1. [Lead Management Module](#1-lead-management-module)
2. [Lead Qualification Module](#2-lead-qualification-module)
3. [Sales Pipeline & Deals Module](#3-sales-pipeline--deals-module)
4. [Follow-up Management & Daily Queue Module](#4-follow-up-management--daily-queue-module)
5. [Communication History & Timeline Module](#5-communication-history--timeline-module)
6. [Meeting & Demo Management Module](#6-meeting--demo-management-module)
7. [Proposal & Quotation Module](#7-proposal--quotation-module)
8. [Deal & Payment Management Module](#8-deal--payment-management-module)
9. [Customer Management Module](#9-customer-management-module)
10. [Task Management Module](#10-task-management-module)
11. [Team & RBAC Permissions Module](#11-team--rbac-permissions-module)
12. [Dashboard & Reporting Module](#12-dashboard--reporting-module)
13. [Automation & Ingestion Engine Module (P2)](#13-automation--ingestion-engine-module-p2)
14. [AI & Conversational Intelligence Module (P2)](#14-ai--conversational-intelligence-module-p2)

---

## 1. Lead Management Module

* **Purpose:** Serves as the central repository for capturing, cataloging, searching, deduping, and organizing prospective client records across all inbound and outbound channels.
* **Target Users:** BDEs, Sales Managers, Marketing Executives, Admins.
* **MVP Priority:** **P0**
* **Major Screens:**
  - Lead List / Table View (with rich filters, column customization, quick actions)
  - Lead Detail Overview View (summary header, contact info, owner, status badge, next action banner)
  - Manual Lead Creation Modal / Page
  - Bulk Lead Import & Column Mapping Wizard
  - Duplicate Resolution Modal
* **Key Actions:**
  - Create, view, edit, soft-delete lead
  - Import leads from CSV/Excel
  - Search and filter by source, campaign, stage, owner, tag, creation date
  - Assign or reassign lead owner
  - Merge or resolve duplicate leads
* **Required Data:** Full name, company name, primary phone, secondary phone, WhatsApp number, email, source (`META_ADS`, `GOOGLE_ADS`, `WEBSITE_FORM`, `WHATSAPP`, `MANUAL`, `IMPORT`), campaign, UTM tags, industry, location, service interest, status, ownerId.
* **Dependencies:** RBAC Module, Team Module.

---

## 2. Lead Qualification Module

* **Purpose:** Standardizes the BANT qualification process to evaluate whether a lead possesses a legitimate need, budget, authority, and urgency before committing high-touch sales resources.
* **Target Users:** BDEs, Sales Managers.
* **MVP Priority:** **P0**
* **Major Screens:**
  - Qualification Drawer / Tab within Lead Detail View
  - Qualification Scoring Config Modal (Admin only)
* **Key Actions:**
  - Complete mandatory qualification questions
  - Categorize lead into `Hot`, `Warm`, `Cold`, or `Unqualified`
  - Record unqualification reasons and notes
  - Trigger automatic lead score calculation
* **Required Data:** Problem statement / requirement details, estimated budget range, budget readiness flag, decision-maker status (Direct, Influencer, End-user), purchase timeline (<2 weeks, 1 month, 3 months, exploring), computed lead score, qualification timestamp, qualifying user.
* **Dependencies:** Lead Management Module.

---

## 3. Sales Pipeline & Deals Module

* **Purpose:** Provides a visual, interactive Kanban workflow for tracking opportunities from qualification through contract negotiation, revenue forecasting, and final closing.
* **Target Users:** BDEs, Sales Managers, Leadership.
* **MVP Priority:** **P0**
* **Major Screens:**
  - Kanban Pipeline Board (Columns representing sales stages)
  - Deal Table View (Spreadsheet-style list with stage pills)
  - Deal Detail Modal / View
  - Closed-Lost Reason Capture Modal
  - Closed-Won Contract Summary Modal
* **Key Actions:**
  - Drag-and-drop deals across pipeline stages
  - Create and edit deals linked to leads
  - Update deal monetary value, currency, and expected closing date
  - Enforce mandatory lost reason when moving to `Closed-Lost`
  - Filter board by BDE, service line, lead source, and date range
* **Required Data:** Deal title, leadId, stageId, amount, currency, probability percentage, expected close date, status (`OPEN`, `WON`, `LOST`), lostReasonId, lostReasonDetails, closedAt.
* **Dependencies:** Lead Management Module, Team Module.

---

## 4. Follow-up Management & Daily Queue Module

* **Purpose:** Drives BDE daily execution by organizing all scheduled calls, messages, demos, and follow-ups into actionable, prioritized daily work queues with strict Next Action enforcement.
* **Target Users:** BDEs, Sales Managers.
* **MVP Priority:** **P0**
* **Major Screens:**
  - BDE Daily Work Dashboard ("My Action Queue")
  - Scheduled Follow-ups List & Calendar View
  - Log Follow-up Outcome & Schedule Next Action Modal
  - Overdue Follow-ups Manager Alert Center
* **Key Actions:**
  - View daily queued tasks grouped by: Overdue, Pending Calls, WhatsApp Follow-ups, Today's Demos, Hot Leads
  - Complete follow-up task and log interaction outcome
  - Schedule mandatory Next Action with date, time, and purpose
  - Reschedule or reassign follow-up task with reason
* **Required Data:** TaskId, leadId, dealId, ownerId, actionType (`CALL`, `WHATSAPP`, `EMAIL`, `MEETING`, `PROPOSAL`), scheduledDate, scheduledTime, purpose, status (`PENDING`, `COMPLETED`, `OVERDUE`, `RESCHEDULED`, `CANCELLED`), outcomeNotes, completedAt.
* **Dependencies:** Lead Management Module, Task Module.

---

## 5. Communication History & Timeline Module

* **Purpose:** Aggregates every customer interaction across phone calls, WhatsApp messages, emails, meetings, and documents into a unified, chronological activity stream.
* **Target Users:** BDEs, Sales Managers, Delivery Leads.
* **MVP Priority:** **P1** (Core manual logging in P0; deep provider integrations in P1)
* **Major Screens:**
  - Chronological Activity Feed (Embedded in Lead & Customer Detail Views)
  - Call Log Details Modal (with duration, outcome, and audio player if recording exists)
  - WhatsApp Thread View Drawer
  - Email Message Viewer & Composer
* **Key Actions:**
  - Filter activity feed by type (Calls, WhatsApp, Emails, Notes, Stage Changes, Files)
  - Post internal notes and mention team members
  - View full two-way WhatsApp chat history
  - Play back telephony call recordings (if enabled)
* **Required Data:** ActivityId, leadId, userId, activityType (`CALL`, `WHATSAPP`, `EMAIL`, `NOTE`, `MEETING`, `PROPOSAL`, `STAGE_CHANGE`), title, description, metadata JSON (call duration, messageId, emailSubject, recordingUrl), createdAt.
* **Dependencies:** Lead Management Module, StorageAdapter, TelephonyAdapter, MessagingAdapter.

---

## 6. Meeting & Demo Management Module

* **Purpose:** Facilitates scheduling, hosting, attendance tracking, and outcome evaluation for sales discovery meetings and product/service demonstrations.
* **Target Users:** BDEs, Sales Engineers, Sales Managers.
* **MVP Priority:** **P1**
* **Major Screens:**
  - Schedule Meeting Modal (Integrated date/time picker, attendee selector)
  - Meeting Details View
  - Post-Meeting Outcome & Next Steps Form
* **Key Actions:**
  - Schedule meeting/demo linked to lead or deal
  - Generate/attach Google Meet, Zoom, or Teams links
  - Log attendance status (`Scheduled`, `Completed`, `Rescheduled`, `No-Show`, `Cancelled`)
  - Record demo feedback, technical requirements, and next action
* **Required Data:** MeetingId, leadId, dealId, hostUserId, title, startTime, endTime, meetingUrl, status, outcomeSummary, nextStepNotes.
* **Dependencies:** Lead Management, Follow-up Management.

---

## 7. Proposal & Quotation Module

* **Purpose:** Manages the creation, version tracking, document storage, and commercial revision history of quotations and client proposals.
* **Target Users:** BDEs, Sales Managers, Delivery Leads.
* **MVP Priority:** **P1**
* **Major Screens:**
  - Proposal List Table
  - Proposal Creation & Line-Item Editor
  - Proposal Version History & Comparison View
  - Proposal PDF Preview Modal
* **Key Actions:**
  - Generate new proposal record with unique quotation reference
  - Add service line items, pricing, payment terms, and discount rates
  - Upload / attach finalized proposal PDF
  - Create revised version (v1 -> v2) when scope or pricing changes
  - Update status (`Draft`, `Sent`, `Under Review`, `Accepted`, `Declined`)
* **Required Data:** ProposalId, dealId, leadId, quotationNumber, versionNumber, totalAmount, currency, discountAmount, paymentTerms, status, fileUrl, validUntil, createdByUserId.
* **Dependencies:** Sales Pipeline Module, StorageAdapter.

---

## 8. Deal & Payment Management Module

* **Purpose:** Tracks commercial contract terms, payment milestones, advance amounts received, and revenue realization upon deal closure.
* **Target Users:** BDEs, Sales Managers, Finance / Delivery Leads.
* **MVP Priority:** **P0** (Core revenue & lost reasons) / **P1** (Milestones & payment tracking)
* **Major Screens:**
  - Won Deal Finalization Form
  - Payment Milestone Tracker
  - Lost Opportunity Analytics Table
* **Key Actions:**
  - Record advance payment received against closed-won deal
  - Log payment transaction reference, mode (Bank Transfer, UPI, Card), and payment date
  - Schedule remaining milestone payment dates
  - Select mandatory standardized lost reason on deal loss
* **Required Data:** PaymentId, dealId, customerId, amount, currency, paymentDate, paymentMethod, transactionReference, paymentType (`ADVANCE`, `MILESTONE`, `FULL_PAYMENT`), status (`RECEIVED`, `PENDING`, `OVERDUE`).
* **Dependencies:** Sales Pipeline Module.

---

## 9. Customer Management Module

* **Purpose:** Converts won sales leads into long-term customer records, maintaining purchased services, ongoing retainers, contracts, and retention touchpoints.
* **Target Users:** Account Managers, Delivery Leads, BDEs, Management.
* **MVP Priority:** **P0** (Conversion & profile storage) / **P1** (Full retention tracking)
* **Major Screens:**
  - Customer Directory View
  - Customer 360 Profile (Contact info, historical deals, active services, communication history)
  - Contract & Retainer Renewal Tracker
* **Key Actions:**
  - Convert won lead to customer
  - Manage multiple stakeholder contacts per customer organization
  - Track active services, AMC contracts, and renewal dates
  - Log ongoing client relationship notes and upsell opportunities
* **Required Data:** CustomerId, originalLeadId, companyName, industry, primaryContactName, billingAddress, taxId/GST, accountManagerUserId, status (`ACTIVE`, `INACTIVE`, `CHURNED`), contractStartDate, contractEndDate.
* **Dependencies:** Lead Management, Sales Pipeline Module.

---

## 10. Task Management Module

* **Purpose:** Underpins the follow-up engine by providing generic and CRM-specific task scheduling, priority assignment, deadline tracking, and status management.
* **Target Users:** All authenticated users.
* **MVP Priority:** **P0**
* **Major Screens:**
  - Global Task List View
  - Lead-Embedded Task List
  - Task Creation / Edit Modal
* **Key Actions:**
  - Create task linked to lead, deal, or customer
  - Set priority (`Low`, `Medium`, `High`, `Urgent`) and due datetime
  - Assign task owner and supporting collaborators
  - Mark task complete with resolution notes
* **Required Data:** TaskId, title, description, dueDate, dueTime, priority, status, assignedUserId, createdByUserId, entityType (`LEAD`, `DEAL`, `CUSTOMER`, `GENERAL`), entityId.
* **Dependencies:** Team & RBAC Module.

---

## 11. Team & RBAC Permissions Module

* **Purpose:** Manages organization users, sales teams, hierarchical reporting, role-based authorization, and data visibility rules.
* **Target Users:** Admins, Sales Managers.
* **MVP Priority:** **P0**
* **Major Screens:**
  - User Directory & Invite Modal
  - Team Structure & Hierarchy View
  - Role & Permission Matrix Configuration View
* **Key Actions:**
  - Invite, activate, deactivate users
  - Assign roles (`Admin`, `Sales Manager`, `BDE`, `Marketing`, `Delivery`)
  - Create teams and assign team leaders
  - Configure data access policies (Self-only vs. Team-wide vs. Organization-wide)
* **Required Data:** UserId, organizationId, email, passwordHash, firstName, lastName, phone, role, teamId, isActive, lastLoginAt.
* **Dependencies:** None (Core foundation).

---

## 12. Dashboard & Reporting Module

* **Purpose:** Aggregates transactional CRM data into real-time operational and strategic dashboards for sales reps, managers, and executives.
* **Target Users:** BDEs, Sales Managers, Leadership.
* **MVP Priority:** **P0**
* **Major Screens:**
  - **BDE Daily Work Dashboard:** Overdue follow-ups, pending calls, today's demos, proposals awaiting reply, hot leads, no-activity alerts.
  - **Management Executive Dashboard:** Funnel conversion velocity, total pipeline value, realized won revenue, lost revenue & reason breakdown, BDE performance leaderboard, campaign/source ROI.
* **Key Actions:**
  - Filter dashboards by date ranges (Today, This Week, This Month, Custom), Team, BDE, Source
  - Drill down into specific chart segments (e.g. click "Overdue" to open filtered lead list)
  - Export executive summary reports
* **Required Data:** Real-time query aggregations over `Lead`, `Deal`, `Task`, `Activity`, `StageHistory`, and `Payment` tables.
* **Dependencies:** All Core P0 Modules.

---

## 13. Automation & Ingestion Engine Module (P2)

* **Purpose:** Executes automated background rules, SLA escalation timers, welcome message dispatches, and multi-source webhook parsing.
* **Target Users:** System (Admins configure rules).
* **MVP Priority:** **P2**
* **Major Screens:**
  - Automation Rules List & Builder
  - Webhook Logs & Health Monitor
* **Key Actions:**
  - Execute automated lead assignment algorithms
  - Trigger webhook ingestion from Meta Lead Ads and website forms
  - Fire automated SLA violation alerts to managers
* **Required Data:** RuleId, triggerType, conditionJson, actionJson, isActive, executionLogs.
* **Dependencies:** Lead Management, Ingestion Webhooks.

---

## 14. AI & Conversational Intelligence Module (P2)

* **Purpose:** Employs Large Language Models via `LlmAdapter` to analyze call transcripts and text threads, extracting structured qualification criteria, pain points, budget signals, and coaching feedback.
* **Target Users:** BDEs, Sales Managers.
* **MVP Priority:** **P2**
* **Major Screens:**
  - AI Call Summary & Extraction Card (Embedded in Activity view)
  - AI Sales Coaching & Recommendation Panel
* **Key Actions:**
  - Generate structured summary from interaction transcript
  - Extract BANT parameters and separate stated facts from inference
  - Suggest personalized follow-up response templates
* **Required Data:** AnalysisId, activityId, rawTranscript, structuredFactsJson (requirements, budget, timeline, objections), inferenceNotesJson, suggestedNextAction, modelVersion.
* **Dependencies:** Communication History Module, LlmAdapter, SttAdapter.
