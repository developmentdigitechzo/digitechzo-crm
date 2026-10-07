# DigiTechzo CRM — UI Design System Specification

> **STATUS:** APPROVED DESIGN SPECIFICATION  
> **Version:** 1.0.0  
> **Type:** System-Wide Visual & Component Standard  
> **Source Tokens:** [`docs/BRAND-TOKENS.md`](file:///c:/DigiTechzo%20CRM/docs/BRAND-TOKENS.md)  
> **Reference Context:** Step B (App Shell & Primitives) + Step C (Dashboard Reference)  

---

## 1. Design System Philosophy & Principles

The DigiTechzo CRM is an **operational, action-first sales and revenue platform**, NOT a generic administrative dashboard or marketing brochure. Every screen, component, and interaction must adhere to four immutable principles:

1. **Data-First, Action-First:** Surfaces critical tasks, overdue actions, hot prospects, and revenue metrics immediately. No decorative illustrations, marketing paragraphs, or visual bloat.
2. **Dense Yet Scannable:** Compact vertical rhythm allows sales reps and managers to scan dozens of records per minute without feeling cramped or disoriented.
3. **Rigid Visual Consistency:** The exact same typography scale, button heights, table row paddings, badge formats, and border radii apply across all 17 CRM modules.
4. **Intentional Color Economy:** Neutral surfaces (`#FFFFFF`, `#F8FAFC`, `#16181B`) form the canvas. Brand green (`#57B71B`) is reserved for primary CTAs and active states. Semantic colors (red, amber, blue, emerald) strictly communicate operational status. Tech purple (`#7C3AED`) is reserved for demos, AI, and automation features.

---

## 2. Global Color Tokens

### 2.1 Core Neutral Canvas & Brand Tokens

| Token | Hex / CSS Value | Description / Application |
| :--- | :--- | :--- |
| `brand-green` | `#57B71B` | Primary brand accent, primary CTA buttons, active route highlights |
| `brand-green-hover` | `#469815` | Hover state for primary buttons and interactive brand elements |
| `brand-green-light` | `#F0FDF4` | Soft background for brand pills, active list highlights |
| `brand-green-glow` | `rgba(87, 183, 27, 0.25)` | Focus rings, subtle highlight outlines |
| `tech-purple` | `#7C3AED` | Selective technology accent: Technical demos, AI insights, automation tags |
| `tech-purple-light` | `#F5F3FF` | Background for demo pills, AI extraction cards |
| `dark-shell` | `#16181B` | Sidebar navigation canvas, dark modal backgrounds |
| `dark-surface` | `#202428` | Sidebar hover state, dark dropdown surfaces |
| `dark-border` | `#2D3238` | Sidebar dividers, dark mode container borders |
| `workspace-bg` | `#F8FAFC` | Global application canvas behind all cards and tables |
| `card-bg` | `#FFFFFF` | Standard card surface, modal surface, drawer background |
| `border-subtle` | `#E2E8F0` | Default card borders, table dividers, input borders |
| `border-strong` | `#CBD5E1` | Active input borders, hovered card borders |
| `txt-primary` | `#1E242B` | Headings, table primary values, bold metrics, rep names |
| `txt-secondary` | `#4A5568` | Body descriptions, secondary table columns, company names |
| `txt-muted` | `#556070` | Timestamps, metadata, column headers, input placeholders |

### 2.2 Semantic Status Palette

Status colors must never be overridden with brand green. Every status state follows strict WCAG AA contrast pairings:

| Semantic State | Text Hex | Background Hex | Border Hex | CRM Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Danger / Overdue / Lost** | `#DC2626` | `#FEF2F2` | `#FECACA` | Overdue follow-up, Closed-Lost deal, Hot urgency tag |
| **Warning / Pending / Warm** | `#D97706` | `#FFFBEB` | `#FDE68A` | Pending task, Warm lead, Scheduled follow-up today |
| **Success / Won / Active** | `#16A34A` | `#F0FDF4` | `#BBF7D0` | Closed-Won deal, Completed task, Active account |
| **Info / Scheduled / Cold** | `#2563EB` | `#EFF6FF` | `#BFDBFE` | Cold lead, Rescheduled task, New inquiry |
| **Tech / Demo / Meeting** | `#7C3AED` | `#F5F3FF` | `#DDD6FE` | Scheduled demo, AI extraction, Web3/Dev service |
| **Neutral / Draft / Inactive**| `#556070` | `#F1F5F9` | `#E2E8F0` | Draft proposal, Unqualified lead, Churned account |

---

## 3. Typography Scale & Standards

The system uses **Manrope** (weights: Regular 400, Medium 500, SemiBold 600, Bold 700, ExtraBold 800) loaded via Google Fonts. All numbers representing currencies, dates, or counts must use tabular figures (`font-variant-numeric: tabular-nums`).

| Typography Role | Size | Line Height | Weight | Tracking | CSS Utility / Sample |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title** | 20px (`1.25rem`) | 28px (`1.75rem`) | Bold (700) | `-0.02em` | `text-xl font-bold tracking-tight text-[#1E242B]` |
| **Section Title** | 14px (`0.875rem`)| 20px (`1.25rem`) | Bold (700) | `+0.025em` | `text-xs sm:text-sm font-bold uppercase tracking-wide text-[#1E242B]` |
| **Card Header** | 15px (`0.9375rem`)| 22px (`1.375rem`)| SemiBold (600) | `-0.01em` | `text-[15px] font-semibold text-[#1E242B]` |
| **Body Primary** | 13px (`0.8125rem`)| 18px (`1.125rem`)| Medium (500) | `normal` | `text-[13px] font-medium text-[#1E242B]` |
| **Body Secondary**| 12px (`0.75rem`)  | 16px (`1.0rem`)  | Regular (400)| `normal` | `text-xs text-[#4A5568]` |
| **Table Header** | 11px (`0.6875rem`)| 14px (`0.875rem`)| SemiBold (600) | `+0.05em` | `text-[11px] font-semibold uppercase tracking-wider text-[#556070]` |
| **Table Body**   | 12px (`0.75rem`)  | 16px (`1.0rem`)  | Regular (400)| `normal` | `text-xs text-[#1E242B] font-tabular` |
| **Metadata / Time**| 11px (`0.6875rem`)| 14px (`0.875rem`)| Regular (400)| `normal` | `text-[11px] text-[#556070]` |
| **KPI Value**    | 24px (`1.5rem`)   | 30px (`1.875rem`)| Bold (700)   | `-0.02em` | `text-2xl font-bold font-tabular text-[#1E242B]` |
| **KPI Label**    | 11px (`0.6875rem`)| 14px (`0.875rem`)| SemiBold (600) | `+0.05em` | `text-[11px] font-semibold uppercase tracking-wider text-[#556070]` |
| **Button Text**  | 12px (`0.75rem`)  | 16px (`1.0rem`)  | SemiBold (600)| `normal` | `text-xs font-semibold` |
| **Badge Text**   | 11px (`0.6875rem`)| 14px (`0.875rem`)| SemiBold (600)| `normal` | `text-[11px] font-semibold` |

---

## 4. Spacing Scale, Radii & Elevation

### 4.1 Spacing Grid
The UI operates on an incremental 4px / 8px grid:
- `gap-1` / `p-1`: 4px (micro indicators, badge padding)
- `gap-2` / `p-2`: 8px (icon button padding, small gap)
- `gap-3` / `p-3`: 12px (card inner padding compact, filter gap)
- `gap-3.5` / `p-3.5`: 14px (standard table row padding, compact card)
- `gap-4` / `p-4`: 16px (standard card padding, header padding)
- `gap-5` / `space-y-5`: 20px (standard section gap between cards/tables)
- `p-6`: 24px (desktop page container padding)

### 4.2 Border Radii
- **Badges / Status Pills:** `6px` (`rounded-badge` / `rounded-[6px]`)
- **Buttons & Inputs:** `8px` (`rounded-btn` / `rounded-[8px]`)
- **Standard Cards:** `10px` (`rounded-card` / `rounded-[10px]`)
- **Modals & Drawers:** `12px` (`rounded-dialog` / `rounded-[12px]`)
- **Avatars / Circular Marks:** `9999px` (`rounded-full`)

### 4.3 Shadows & Elevation
- **Flat Surface (Default Cards):** `shadow-none` with `border border-[#E2E8F0]`. (No heavy drop shadows in high-density CRM tables).
- **Subtle Elevation (Dropdowns & Popovers):** `shadow-sm` (`0 1px 2px 0 rgba(0, 0, 0, 0.05)`).
- **Elevated Modals & Floating Drawers:** `shadow-lg` (`0 10px 15px -3px rgba(0, 0, 0, 0.1)`).

---

## 5. UI Component Primitives

### 5.1 Buttons

| Variant | Visual Properties | Height | Usage |
| :--- | :--- | :--- | :--- |
| **Primary (Brand)** | `bg-[#57B71B] hover:bg-[#469815] text-white rounded-btn font-semibold` | 32px (`h-8`) or 28px (`h-7`) | Primary screen CTA (`Add Lead`, `Schedule Task`, `Save`) |
| **Secondary (Subtle)**| `bg-slate-100 hover:bg-slate-200 text-[#1E242B] rounded-btn font-semibold` | 32px or 28px | In-row actions (`Log Outcome`, `View Details`, `Cancel`) |
| **Outline** | `bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#4A5568] rounded-btn` | 32px or 28px | Filters, export buttons, secondary navigation |
| **Ghost** | `hover:bg-slate-100 text-[#556070] hover:text-[#1E242B] rounded-btn` | 32px or 28px | Icon buttons, pagination arrows, dismiss controls |
| **Danger** | `bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#DC2626] rounded-btn` | 32px or 28px | Destructive actions (`Delete Lead`, `Unqualify`) |

### 5.2 Status Badges

Badges are compact (height: 20–22px, padding: `px-2 py-0.5`, radius: `6px`, text: `11px font-semibold`):
- **Overdue / Hot:** `bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]`
- **Pending / Warm:** `bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]`
- **Won / Completed:** `bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]`
- **Cold / New / Info:** `bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]`
- **Demo / Tech:** `bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]`
- **Neutral / Draft:** `bg-[#F1F5F9] text-[#556070] border border-[#E2E8F0]`

### 5.3 Form Inputs & Selects

- **Standard Input Height:** 32px (`h-8 text-xs`) for dense forms; 36px (`h-9 text-xs sm:text-sm`) for modal dialogs.
- **Border & Background:** `bg-white border border-[#E2E8F0] rounded-btn`.
- **Focus State:** `focus-visible:ring-1 focus-visible:ring-[#57B71B] focus-visible:border-[#57B71B]`.
- **Labels:** `text-caption text-[#4A5568] font-medium block mb-1`.
- **Error State:** `border-rose-400 focus-visible:ring-rose-400`.

### 5.4 Standard Data Tables

- **Container:** `Card` with `p-0 border border-[#E2E8F0] rounded-card overflow-hidden bg-white`.
- **Header Row (`<thead>`):** Height: 36px. Background: `bg-slate-50/70 border-b border-[#E2E8F0]`. Text: `11px font-semibold uppercase tracking-wider text-[#556070] px-3.5`.
- **Data Rows (`<tr>`):** Height: 44–48px. Border: `border-b border-[#E2E8F0] last:border-0`. Hover: `hover:bg-slate-50/80 transition-colors`.
- **Cells (`<td>`):** `px-3.5 py-2.5 text-xs text-[#1E242B] font-tabular align-middle`.
- **Table Footer / Pagination:** Height: 40px. `bg-white border-t border-[#E2E8F0] px-3.5 flex items-center justify-between text-xs text-[#556070]`.

### 5.5 Cards & Section Headers

- **Card Structure:**
  ```tsx
  <Card className="border-border shadow-none rounded-card bg-white">
    <CardHeader className="py-3 px-4 border-b border-border bg-slate-50/50 flex flex-row items-center justify-between">
      <CardTitle className="text-xs sm:text-sm font-bold text-txt-primary uppercase tracking-wide">
        Title
      </CardTitle>
      {/* Optional link or badge */}
    </CardHeader>
    <CardContent className="p-4">
      {/* Content */}
    </CardContent>
  </Card>
  ```

### 5.6 Tabs & Filter Controls

- **Pill Tabs (Screen Category Filters):** Compact pill list (`px-2.5 py-1 rounded-full text-xs font-semibold`). Active: `bg-[#16181B] text-white` (or semantic active color). Inactive: `bg-white border border-border text-[#4A5568] hover:bg-slate-50`.
- **Underline Tabs (Detail View Drawers):** Border bottom line. Active: `border-b-2 border-[#57B71B] text-[#57B71B] font-bold`. Inactive: `text-[#556070] hover:text-[#1E242B]`.

### 5.7 Modals & Drawers

- **Modal Dialog:** Centered overlay with backdrop blur `bg-black/50 backdrop-blur-xs`. Modal card width: 480px (Standard) or 640px (Wide). Header height: 48px with title and close button. Footer: 48px with right-aligned action buttons (`Cancel` + Primary CTA).
- **Detail View Drawer:** Slide-out from right edge. Width: 480px (Tablet/Desktop) or 100% (Mobile). Background: `#FFFFFF`. Divider: `border-l border-[#E2E8F0]`. Allows viewing details while preserving table context.

### 5.8 Overdue & Attention Alert Banners

- **Style:** Compact full-width banner (`bg-[#FEF2F2] border border-rose-200/80 rounded-card p-3 px-4`).
- **Icon:** `AlertCircle` in `#DC2626`.
- **Text:** Bold title in `#991B1B`, short helper in `#B91C1C`.
- **Action:** Right-aligned compact button (`View Overdue` in white outline with rose border).

### 5.9 Kanban Pipeline Cards

- **Column Container:** Width: 280–300px. Background: `bg-slate-50/60 rounded-card border border-[#E2E8F0] p-2.5 space-y-2.5`.
- **Column Header:** Stage name, deal count pill, total value in tabular figures.
- **Deal Card:** White surface (`bg-white rounded-btn border border-[#E2E8F0] p-3 shadow-none hover:border-slate-300 transition-all space-y-2`).
  - Line 1: Deal title (`font-bold text-xs text-[#1E242B] truncate`).
  - Line 2: Lead / company name with building icon (`text-[11px] text-[#4A5568]`).
  - Line 3: Deal amount in bold rupee format (`font-bold text-xs text-[#1E242B] font-tabular`) + probability badge.
  - Line 4: Expected closing date + owner avatar initials.

### 5.10 Empty, Loading & Error States

- **Empty State:** Centered container (`py-12 text-center space-y-2`). Clean outline icon (32px, opacity 40%). Title: `13px font-bold text-[#1E242B]`. Description: `11px text-[#556070] max-w-xs mx-auto`. Optional action button.
- **Loading State:** Minimal skeleton rows or centered spinner (`LoadingSpinner` in `#57B71B`).
- **Error State:** Subtle alert box (`bg-[#FEF2F2] border border-rose-200 text-[#DC2626] p-4 rounded-card text-xs flex items-center gap-2`).

---

## 6. Responsive Breakpoint Rules

| Viewport | Target Width | Layout Behavior |
| :--- | :--- | :--- |
| **Desktop Wide** | $\ge 1440\text{px}$ | Sidebar expanded (224px). Full multi-column grids (4-col KPI, 12-col main split). Complete tables with all columns visible. |
| **Desktop Standard** | $1024\text{px} - 1439\text{px}$ | Sidebar collapsible (toggleable to 64px). 4-col KPI with adaptive typography. Tables show priority columns; secondary metadata hidden or truncated. |
| **Tablet Portrait** | $768\text{px} - 1023\text{px}$ | Sidebar collapsed by default. 2-col KPI grids. Main operational layouts stack vertically. Kanban board enables horizontal swipe. |
| **Mobile** | $320\text{px} - 767\text{px}$ | Top bar with hamburger drawer. 2-col or single-col KPI cards. Tables convert into compact cards. Action buttons minimum 44px touch targets. **Zero horizontal page overflow.** |

---

## 7. Content & Copywriting Style Guide

- **Action-First Labels:** Use short imperative verbs: `Add Lead`, `Log Call`, `Schedule Demo`, `Send Quote`.
- **Zero Filler Text:**
  - ❌ *"Manage and monitor all your inbound sales leads from one centralized workspace."*
  - ✅ *"Your sales activity and priority queue at a glance"*
- **Consistent Number Formatting:** All rupee figures formatted with Indian numbering system (`₹12,50,000`). All dates formatted consistently (`5 Oct 2026`).
- **Status Capitalization:** Title Case or Uppercase badges (`Hot`, `Overdue`, `Completed`).
