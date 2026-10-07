# DigiTechzo CRM — Brand Design Tokens Specification

> **STATUS:** EXTRACTED FROM OFFICIAL BRAND WEBSITE  
> **Source Website:** [https://digitechzo.com](https://digitechzo.com)  
> **Source Stylesheet:** `https://digitechzo.com/assets/css/style.css?v=1790656800`  
> **Phase:** Step A — Brand Token Extraction & UI Audit

---

## 1. Brand Identity & Source Evidence

The brand tokens below are extracted directly from the computed styles and CSS custom properties defined in DigiTechzo's production corporate website.

```
/* Extracted from https://digitechzo.com/assets/css/style.css */
:root {
  --primary-green: #57B71B;
  --primary-green-hover: #469815;
  --primary-green-light: rgba(87, 183, 27, 0.1);
  --primary-green-glow: rgba(87, 183, 27, 0.3);

  --dark-bg: #16181b;
  --dark-surface: #202428;
  --dark-border: #2d3238;

  --text-dark: #1e242b;
  --text-body: #4a5568;
  --text-muted: #556070;
  --light-bg: #f8fafc;
  --card-bg: #ffffff;
  --border-color: #e2e8f0;

  --font-main: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

---

## 2. Core Color Palette

| Token Name | Hex / Value | Source on Website | CRM Application Usage |
| :--- | :--- | :--- | :--- |
| **Brand Primary Green** | `#57B71B` | `.btn-accent`, `.text-accent`, `:root --primary-green` | Primary CTAs, active route indicator, key milestones |
| **Brand Primary Hover** | `#469815` | `.btn-accent:hover`, `:root --primary-green-hover` | Button & interactive hover states |
| **Brand Green Light / Soft** | `#F0FDF4` (`rgba(87,183,27,0.1)`) | `:root --primary-green-light` | Active background highlight, success badges |
| **Brand Green Glow / Shadow** | `rgba(87, 183, 27, 0.25)` | `:root --shadow-accent` | Primary focus ring, subtle active glow |
| **Secondary Tech Accent** | `#7C3AED` | `.text-purple`, `.bg-purple` in tech features | AI insights, automation tags, meeting badges |
| **Dark Header / Sidebar** | `#16181B` | `:root --dark-bg` | Main CRM navigation sidebar, dark login card shell |
| **Dark Surface** | `#202428` | `:root --dark-surface` | Sidebar active item, user selector container |
| **Dark Border** | `#2D3238` | `:root --dark-border` | Sidebar dividers, dark mode borders |
| **Workspace Canvas** | `#F8FAFC` | `:root --light-bg` | Main CRM page background behind cards & tables |
| **Surface / Card Background** | `#FFFFFF` | `:root --card-bg` | Table containers, card bodies, dialogs |
| **Border Color** | `#E2E8F0` | `:root --border-color` | Table gridlines, card borders, input borders |
| **Primary Text (Headings)** | `#1E242B` | `:root --text-dark`, `h1-h6` | Page titles, card titles, table data, bold values |
| **Body Text** | `#4A5568` | `:root --text-body`, `body` | Table secondary text, form labels, descriptions |
| **Muted Text** | `#556070` | `:root --text-muted`, `.section-subtitle` | Timestamps, placeholder text, captions |

---

## 3. Semantic Status Palette

Derived from WCAG AA compliant combinations matching DigiTechzo brand tones:

| Status | Text Color | Background Color | Border Color | CRM State Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Success (Won)** | `#16A34A` | `#F0FDF4` | `#BBF7D0` | Closed-Won deals, completed tasks, active accounts |
| **Warning (Pending)** | `#D97706` | `#FFFBEB` | `#FDE68A` | Pending actions, warm leads, negotiations |
| **Danger (Overdue/Lost)** | `#DC2626` | `#FEF2F2` | `#FECACA` | Overdue follow-ups, hot leads, closed-lost |
| **Info (Scheduled/New)** | `#57B71B` | `#F0FDF4` | `#BBF7D0` | New inquiries, brand highlights |
| **Tech / AI / Demo** | `#7C3AED` | `#F5F3FF` | `#DDD6FE` | Scheduled demos, AI extractions, meetings |
| **Neutral (Draft)** | `#556070` | `#F1F5F9` | `#E2E8F0` | Unqualified leads, drafts, inactive records |

---

## 4. Typography Specification

* **Primary Font Family:** `'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
* **Font Weights:** `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold)
* **Google Fonts Link:** `https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&display=swap`
* **Hierarchy:**
  - `Page Title:` 24px / 600 (`letter-spacing: -0.02em`)
  - `Section Title:` 18px / 600
  - `Card Title:` 14–15px / 600
  - `Body Text:` 14px / 400
  - `Secondary / Sub-labels:` 13px / 400
  - `Table Text / Badges:` 12–13px (with tabular figures `font-variant-numeric: tabular-nums`)
  - `Captions:` 11px / 500

---

## 5. Spacing, Borders & Radii

* **Spacing Grid:** 4px / 8px incremental scale (Tailwind base).
* **Border Radii:**
  - Buttons: `8px` (`--radius-btn`)
  - Inputs: `8px` (`--radius-input`)
  - Cards: `10px` (`--radius-card`)
  - Modals / Dialogs: `12px` (`--radius-dialog`)
  - Status Badges: `6px` (`--radius-badge`)
* **Shadows:** Flat / Subtle only (`0 1px 2px 0 rgba(0, 0, 0, 0.05)`). No heavy drop shadows.

---

## 6. Logo & Brand Assets

* **Brand Wordmark:** **DigiTechzo** (Font: Manrope 700, with Green Accent `#57B71B` on icon/mark).
* **Favicon:** `https://www.digitechzo.com/assets/images/digitechzo-favicon.png`
* **Sidebar Monogram:** `DZ` / Geometric Growth Box in `#57B71B`.
