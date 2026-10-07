# DigiTechzo CRM — User Flows & Operational Workflows

> **STATUS:** SPECIFICATION / PLANNING  
> **Version:** 1.0.0  
> **Document Purpose:** Detail step-by-step user journeys, state transitions, validation checkpoints, and edge cases for all primary CRM actors.

---

## 1. Flow 1: Inbound Lead Capture & Deduplication Flow

```
[ External Source: Meta / Google / Web / WhatsApp ]
                       │
                       ▼
         [ Webhook / API Ingestion ]
                       │
                       ▼
        [ Phone / Email Normalization ]
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
    [ Existing Lead? ]    [ New Lead Record ]
       │            │             │
      YES           NO            ▼
       │            │     [ Assign Source/UTM ]
       ▼            │             │
[ Append to Timeline/ ]           ▼
[ Flag Duplicate ]        [ Route to Assignment ]
```

### Step-by-Step Breakdown:
1. **Trigger:** A prospective customer submits a Meta Lead Ad form, Google Ads landing page form, website contact form, or initiates a WhatsApp chat.
2. **Ingestion:** Payload arrives at `/api/v1/leads/ingest` (or provider-specific webhook endpoint).
3. **Data Normalization:** System parses phone number into E.164 format and trims/lowercases email address.
4. **Duplicate Verification:**
   - If phone or email matches an existing active Lead, the event is logged to the existing lead's chronological timeline as a "Duplicate Inquiry / Re-engagement" and flagged.
   - If no match exists, a new `Lead` entity is created with status `New`.
5. **Metadata Capture:** UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`), device info, IP address, and initial service interest are committed.
6. **Next State:** Proceeds immediately to **Lead Assignment Flow**.

---

## 2. Flow 2: Lead Assignment Flow

### Step-by-Step Breakdown:
1. **Trigger:** A new lead is created or an existing lead requires reassignment.
2. **Assignment Strategy Evaluation:**
   - **Automatic (Default):** System executes Round-Robin distribution among available active BDEs within the assigned team/service territory.
   - **Manual:** Sales Manager or Admin selects a specific BDE from the assignment modal.
3. **Ownership Update:** `lead.ownerId` is updated to the selected user.
4. **SLA Timer Start:** System starts the "First Contact SLA Timer" (e.g., 30-minute response target).
5. **Notification:** BDE receives an immediate real-time in-app notification and email alert: *"New Lead Assigned: [Lead Name] - [Service Interest]"*.
6. **Task Initialization:** System generates an initial task: *"First Contact Call / Outreach"* in the BDE's daily queue.

---

## 3. Flow 3: Lead Qualification Flow

```
[ Lead in 'New' Status ]
          │
          ▼
   [ BDE Opens Lead ]
          │
          ▼
 [ Review Inbound Data ]
          │
          ▼
 [ Execute BANT Assessment ]
 ├── Requirement Clarity
 ├── Budget Range
 ├── Decision Authority
 └── Timeline / Urgency
          │
          ▼
  [ Select Lead Status ]
 ├── Hot (High Intent, Ready Budget, Immediate Timeline)
 ├── Warm (Clear Need, Moderate Timeline, Exploring)
 ├── Cold (Vague Need, Low Budget, Long Horizon)
 └── Unqualified (Spam, Invalid Contact, Not a Fit)
          │
          ▼
 [ Save Qualification Record ] ──► [ Update Lead Score ]
```

### Step-by-Step Breakdown:
1. **Trigger:** BDE initiates interaction with a newly assigned lead.
2. **Screen:** BDE navigates to the **Lead Detail > Qualification Tab**.
3. **Form Entry:** BDE completes mandatory qualification questions:
   - **Requirement:** Specific service needed (Web, App, SEO, Custom Dev, Marketing).
   - **Budget:** Client's allocated or estimated budget.
   - **Authority:** Direct Decision Maker, Influencer, or Researcher.
   - **Timeline:** Immediate (< 2 weeks), 1 Month, 3 Months, or Exploring.
4. **System Scoring:** Lead score is automatically computed based on business rules.
5. **Status Update:** BDE updates status to `Hot`, `Warm`, `Cold`, or `Unqualified`.
   - If `Unqualified`, BDE must select an unqualification reason (e.g., No budget, Student inquiry, Invalid contact). Lead is moved out of active queue.
   - If `Hot` / `Warm` / `Cold`, BDE is prompted to schedule the next action or move the deal into the sales pipeline.

---

## 4. Flow 4: First Contact & Interaction Logging Flow

### Step-by-Step Breakdown:
1. **Trigger:** BDE picks a lead from the **"Calls Pending"** or **"New Leads"** queue.
2. **Action:** BDE clicks the contact number (initiating click-to-call or dialer) or launches WhatsApp chat.
3. **Call / Message Execution:** Outreach occurs.
4. **Outcome Modal:** Upon interaction completion, a mandatory **Log Interaction Modal** appears:
   - **Outcome Type:** `Connected - Qualified`, `Connected - Not Interested`, `Busy`, `No Answer`, `Left Voicemail`, `Call Back Requested`, `WhatsApp Sent`.
   - **Interaction Notes:** Concise summary of what was discussed.
   - **Duration:** Call duration in seconds (auto-populated if telephony integrated, or manually entered).
5. **Mandatory Next Action Prompt:** Modal requires the BDE to set the next follow-up before submission.
6. **Commit:** Interaction is added to the chronological timeline and lead `lastActivityAt` timestamp is updated.

---

## 5. Flow 5: Follow-Up & Next Action Enforcement Flow

```
[ Lead Interaction Completed ]
               │
               ▼
[ Mandatory Next Action Prompt ]
 ├── Action Type: Call / WhatsApp / Meeting / Proposal
 ├── Date & Time
 ├── Owner (Defaults to current BDE)
 └── Specific Purpose / Objective
               │
               ▼
   [ Task Created in DB ]
               │
               ▼
     [ Date/Time Reached? ]
       │            │
      YES           NO
       │            │
       ▼            ▼
[ BDE Daily Work ] [ Scheduled Task Waiting ]
[ Queue Display  ]
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
[ Action Completed ]             [ Time Passes Without Action ]
       │                                 │
       ▼                                 ▼
[ Outcome Logged & ]             [ Overdue Alert Triggered ]
[ New Next Action  ]             [ Manager Dashboard Flag  ]
```

### Step-by-Step Breakdown:
1. **Invariant Enforcement:** No lead in an active pipeline stage can exist without a pending `Task` where `isNextAction = true`.
2. **Scheduling:** BDE enters Action Type, Target Date, Target Time, and Action Purpose.
3. **Queue Ingestion:** The task appears in the BDE's **Daily Work Queue** on the scheduled date.
4. **Overdue Handling:** If the target datetime elapses without a logged outcome:
   - Task status transitions to `Overdue`.
   - Lead appears highlighted in red in the BDE's **"Overdue Follow-ups"** queue.
   - Alert is reflected in the Manager's dashboard.
5. **Resolution:** BDE opens the lead, completes the follow-up, logs the outcome, and schedules the subsequent next action.

---

## 6. Flow 6: Pipeline Movement & Kanban Stage Transition Flow

### Step-by-Step Breakdown:
1. **Trigger:** BDE drags a deal card to a new stage on the Kanban board (e.g., from `First Contact` to `Meeting Scheduled`).
2. **Validation Rules:**
   - Stage transitions validate that prerequisite criteria are met (e.g., moving to `Proposal` requires a linked demo record or qualification notes).
   - Moving to `Closed-Lost` immediately triggers the **Mandatory Lost Reason Modal**.
   - Moving to `Closed-Won` triggers the **Deal Closing & Payment Modal**.
3. **Optimistic UI Update:** Card moves smoothly on the board using `dnd-kit`.
4. **Backend Sync:** API call `/api/v1/deals/:id/stage` records the `StageHistory` entry, updating `previousStage`, `newStage`, `changedBy`, `durationInPreviousStageSeconds`, and `timestamp`.
5. **Aggregate Calculations:** Kanban column aggregate header (Count, Total Stage Value, Weighted Revenue) updates dynamically.

---

## 7. Flow 7: Meeting & Demo Management Flow

### Step-by-Step Breakdown:
1. **Trigger:** Prospect agrees to a discovery session, technical review, or product demo.
2. **Booking:** BDE clicks **"Schedule Meeting"** on the Lead / Deal view.
3. **Details Entered:**
   - Title / Topic
   - Date, Start Time, End Time
   - Attendees (Lead contacts + internal technical/sales specialists)
   - Meeting Link (Google Meet, Zoom, MS Teams URL)
4. **Calendar Sync & Invitations:** Calendar event created; prospect receives confirmation email/WhatsApp.
5. **Execution & Attendance:**
   - After the meeting time, BDE marks attendance: `Completed`, `Rescheduled`, `No-Show`, `Cancelled`.
6. **Outcome Logging:** If `Completed`, BDE records demo highlights, client feedback, objections, and immediate next steps.

---

## 8. Flow 8: Proposal & Quotation Workflow

```
[ Lead in 'Proposal' Stage ]
              │
              ▼
   [ Create New Proposal ]
 ├── Quotation Number (Auto)
 ├── Line Items & Services
 ├── Total Quoted Amount
 ├── Discount / Terms
 └── Attach PDF / Document
              │
              ▼
    [ Status: 'Draft' ]
              │
              ▼
    [ BDE Dispatches ] ──────► [ Status: 'Sent' ]
              │
              ▼
    [ Client Reviews ] ──────► [ Status: 'Under Review' ]
              │
       ┌──────┴──────────────┐
       ▼                     ▼
[ Scope/Price Change ]  [ Client Decision ]
       │                     │
       ▼                     ├──────────────┬──────────────┐
[ Create Revision V2 ]       ▼              ▼              ▼
[ Link to Original   ]   [ Accepted ]   [ Declined ]   [ Ghosted ]
```

### Step-by-Step Breakdown:
1. **Creation:** BDE clicks **"New Proposal"**, populating service line items, scope notes, commercial pricing, payment milestones, and currency.
2. **Document Attachment:** Proposal PDF is generated or uploaded via `StorageAdapter`.
3. **Dispatch:** BDE sends proposal via integrated email / WhatsApp or records external transmission. Status changes to `Sent`.
4. **Revisions:** If client requests price adjustments or scope changes, BDE creates a linked revision (`v1` -> `v2`). Historical quotes are permanently preserved for audit.
5. **Outcome:** When approved, proposal status becomes `Accepted` and prompts deal closure.

---

## 9. Flow 9: Won / Lost Closing & Payment Recording Flow

### Step-by-Step Breakdown (Closed-Won):
1. **Trigger:** Client confirms contract award / signs proposal.
2. **Action:** BDE moves deal to `Closed-Won`.
3. **Won Modal Entry:**
   - Final Closed Contract Value
   - Advance / Booking Amount Received
   - Payment Transaction Reference / Date
   - Remaining Milestone Schedule
   - Service Deliverables Summary
4. **System Side-Effects:**
   - Deal status updated to `Won`.
   - Automatic trigger: Lead record converts to **Customer Profile**.
   - Delivery handoff task created for Account Management / Delivery team.

### Step-by-Step Breakdown (Closed-Lost):
1. **Trigger:** Prospect declines proposal, chooses competitor, or cancels initiative.
2. **Action:** BDE moves deal to `Closed-Lost`.
3. **Mandatory Lost Modal:**
   - **Category:** `Price / Budget`, `Competitor Chosen`, `Feature / Scope Mismatch`, `Timing / Project Postponed`, `Lost Contact / Ghosted`, `Authority Rejection`.
   - **Competitor Name:** (If applicable).
   - **Detailed Notes:** Explanatory context required for sales strategy analysis.
4. **System Side-Effects:**
   - Deal status updated to `Lost`.
   - Pending follow-up tasks cancelled or marked closed.
   - Lead moved to archive or nurture list.

---

## 10. Flow 10: Customer Conversion & Delivery Handoff Flow

### Step-by-Step Breakdown:
1. **Trigger:** Deal marked `Closed-Won`.
2. **Entity Generation:** System converts `Lead` into `Customer` entity, carrying over all historical contacts (`LeadPhone`, `LeadEmail`), notes, proposals, and communication timeline.
3. **Account Initialization:**
   - Customer account code generated.
   - Account Manager assigned.
   - Purchased services catalog item initialized with contract start/end dates.
4. **Billing Record:** Outstanding balances and future recurring invoices (e.g., AMC, hosting, retainers) scheduled.
5. **Retention Tracking:** Lead lifecycle transitions to **Retention / Upsell**, setting recurring check-in milestones.

---

## 11. Flow 11: Management Analytics & Reporting Flow

### Step-by-Step Breakdown:
1. **Actor:** Sales Manager, VP of Sales, or Admin.
2. **Navigation:** User opens **Management Dashboard**.
3. **Filter Controls:** User selects date range (Today, This Week, This Month, Quarter-to-date, Custom), Team, BDE, Lead Source, or Service Type.
4. **Visual Analysis:**
   - **Funnel Conversion Rates:** Inspects conversion percentages across each milestone to isolate drop-off bottlenecks.
   - **Pipeline Health:** Reviews total open pipeline value vs. weighted expected revenue.
   - **BDE Performance Scorecard:** Compares call volumes, demo completion ratios, proposal win rates, and average response times across reps.
   - **Marketing Channel ROI:** Analyzes lead volume vs. closed revenue per UTM source/campaign.
   - **Lost Reason Analytics:** Reviews top reasons for lost revenue to guide pricing and positioning decisions.
5. **Exporting:** User can export filtered analytics summaries to CSV/Excel for executive board reporting.
