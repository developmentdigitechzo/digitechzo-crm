# Lead-First Architecture: Migration Safety Report

**Date:** 2026-10-08  
**Audit Target:** PostgreSQL Database (`digitechzo_crm` on localhost:5432)  
**Status:** Read-Only Orphan Record & Safety Assessment Completed  

---

## 1. Current Database Record Counts

A full non-destructive inspection of all transactional and master tables in PostgreSQL yielded the following record counts:

| Model / Table | Total Records | Records with `leadId` | Orphan Records (`leadId = NULL`) | Orphan Percentage |
|---|---|---|---|---|
| **Leads (`leads`)** | **1** | N/A (Master) | N/A | 0.0% |
| **Deals (`deals`)** | **2** | 0 | **2** | 100.0% |
| **Tasks (`tasks`)** | **2** | 2 | **0** | 0.0% |
| **Activities (`activities`)** | **6** | 6 | **0** | 0.0% |
| **Meetings (`meetings`)** | **3** | 3 | **0** | 0.0% |
| **Proposals (`proposals`)** | **4** | 4 | **0** | 0.0% |
| **Customers (`customers`)** | **2** | 1 | **1** | 50.0% |
| **Pipeline Stages** | **6** | Reference Master | N/A | N/A |
| **Lost Reasons** | **5** | Reference Master | N/A | N/A |
| **Users** | **1** | Reference Master | N/A | N/A |

---

## 2. Complete Inventory of Affected Orphan Records

Zero orphan records were deleted or modified during this safety inspection. The **3 affected orphan records** identified across the database are:

### 2.1 Orphan Deals (2 records)

1. **Deal 1:**
   - **ID:** `aab08ed3-2e8e-4fc6-97b4-7770a8c41d37`
   - **Title:** `"Lost & Delete Deal Test"`
   - **Value:** ₹3,00,000 INR
   - **Status:** `LOST` (Stage: *Closed Lost*)
   - **Current `leadId`:** `NULL`
   - **Root Cause:** Created during Phase 3 Deals module testing without selecting an originating Lead.

2. **Deal 2:**
   - **ID:** `7bf736dd-bc65-41fd-9aab-8a48935f7692`
   - **Title:** `"Enterprise Cloud ERP Migration - Phase 1 Updated"`
   - **Value:** ₹8,50,000 INR
   - **Status:** `WON` (Stage: *Closed Won*)
   - **Current `leadId`:** `NULL`
   - **Related Linked Data:** Linked to 4 active Proposals (`PROP-202610-0001` through `0004`) and 1 Customer (`Apex Global Logistics Ltd`), all of which *already* point to Lead `f3b67fd8-184f-44fc-b7d5-1fbc60916d1c` (Kaniga)!

### 2.2 Orphan Customers (1 record)

1. **Customer 2:**
   - **ID:** `310528bc-cd77-4134-a65a-e24692492019`
   - **Company Name:** `"Zenith EdTech Pvt Ltd"`
   - **Contact Name:** `"Ananya Iyer"`
   - **Email:** `ananya@zenithedtech.com`
   - **Phone:** `+91 98765 43212`
   - **Current `leadId`:** `NULL` | **`dealId`:** `NULL`
   - **Root Cause:** Created manually via the Customer creation modal during Customer module verification.

---

## 3. Recommended Handling Strategy for Each Orphan Record

To establish `Lead` as the central master record without deleting or corrupting historical test records:

```
[Strategy 1: Backfill Direct Association]
Deal 2 ("Enterprise Cloud ERP Migration")
  → Update leadId = "f3b67fd8-184f-44fc-b7d5-1fbc60916d1c" (Kaniga)
  Rationale: Its linked Proposals and Customer already belong to Kaniga.

[Strategy 2: Backfill / Synthesize Converted Master Lead]
Customer 2 ("Zenith EdTech Pvt Ltd" - Ananya Iyer)
  → Generate an originating Lead for "Ananya Iyer" (status: CONVERTED, source: MANUAL)
  → Link Customer.leadId to the newly synthesized Master Lead.
  Rationale: Every customer originated from a sales inquiry.

[Strategy 3: Backfill / Synthesize Test Master Lead]
Deal 1 ("Lost & Delete Deal Test")
  → Update leadId = "f3b67fd8-184f-44fc-b7d5-1fbc60916d1c" OR link to a synthesized test lead.
  Rationale: Preserves deal testing history while fulfilling mandatory foreign key integrity.
```

---

## 4. Assessment: Can `leadId` Safely Become Mandatory for Each Model?

| Model | Current Nullability | Can `leadId` Become Mandatory? | Pre-requisites & Recommendations |
|---|---|---|---|
| **`Deal`** | `leadId String?` | **YES (Recommended)** | Once the 2 orphan deals are backfilled with `leadId`, `Deal.leadId` can safely become `String` (NOT NULL). Every commercial deal must belong to a Master Lead. |
| **`Task`** | `leadId String?` | **CONDITIONAL** | Currently 0 orphan tasks. However, sales reps may occasionally create internal operational tasks (e.g. "Review weekly quota"). Recommended: Keep `Task.leadId` nullable at database level, but enforce `leadId` required in the Sales UI and BDE Daily Work Queue. |
| **`Activity`** | `leadId String?` | **CONDITIONAL** | Currently 0 orphan activities. Keep `Activity.leadId` nullable to permit system-wide or customer-level notes, while enforcing `leadId` on all sales calls, WhatsApp logs, and demos. |
| **`Meeting`** | `leadId String?` | **YES (Recommended)** | Currently 0 orphan meetings. Every sales discovery meeting and demo should strictly be scheduled against a Master Lead. |
| **`Proposal`** | `leadId String?` | **YES (Recommended)** | Currently 0 orphan proposals. Every commercial proposal/quotation must be tied to a Master Lead. |
| **`Customer`** | `leadId String?` | **YES (with backfill)** | Once the 1 orphan customer is linked to a synthesized converted lead, `Customer.leadId` can become `String @unique` (1:1 converted lead). |

---

## 5. Non-Destructive Next Step Sequence

1. **Step 1:** Review and approve this Safety Report.
2. **Step 2:** Execute safe data backfill script linking Deal 2, Deal 1, and Customer 2 to master lead IDs (Zero deletions).
3. **Step 3:** Update `schema.prisma` to introduce missing Lead master fields (`stageId`, `estimatedValue`, `campaignName`, UTM parameters, firmographics) and tighten `leadId` relations.
4. **Step 4:** Implement full 360° Lead Dossier view in frontend.

---

## 6. Safety & Verification Status

- **PostgreSQL Database:** Untouched; no tables, rows, or columns altered.
- **MariaDB (`port 3306`):** Untouched and listening on PID 5436.
- **Prisma Schema & Migrations:** Untouched; zero migrations executed.
- **Source Code:** Untouched; zero frontend or backend application code modified.
- **Git Status:** Clean; no commits or pushes performed.
