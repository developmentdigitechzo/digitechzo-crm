# DigiTechzo CRM — Frontend Architecture Specification

> **STATUS:** SPECIFICATION / PLANNING  
> **Architecture Classification:** **TARGET ARCHITECTURE / PROPOSED ARCHITECTURE**  
> **Planned Stack:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query + dnd-kit  
> **Phase:** Phase 0 — Documentation / Planning (Zero application code created)

---

## 1. Proposed Application Directory Structure

```
frontend/
├── public/                     # Static public assets (favicons, logos)
├── src/
│   ├── app/                    # App initialization & global providers
│   │   ├── App.tsx             # Root application component
│   │   ├── providers.tsx       # Combined context providers (Query, Theme, Auth)
│   │   └── router.tsx          # React Router / TanStack Router definition
│   │
│   ├── assets/                 # SVGs, brand icons, and static images
│   │
│   ├── components/             # Reusable UI primitives
│   │   ├── ui/                 # shadcn/ui components (button, dialog, dropdown, input, etc.)
│   │   └── feedback/           # Toast, confirmation modals, error boundaries, empty states
│   │
│   ├── layouts/                # Page shell layouts
│   │   ├── AuthLayout.tsx      # Centered layout for Login, Password Reset
│   │   ├── DashboardLayout.tsx # Main authenticated shell with Sidebar, Header & Next Action Bar
│   │   └── PublicLayout.tsx    # Public forms & lead capture pages
│   │
│   ├── features/               # Domain feature modules
│   │   ├── auth/               # Login, session guard, password management
│   │   ├── leads/              # Lead table, lead detail, create modal, import wizard
│   │   ├── pipeline/           # Kanban board, deal cards, stage transitions, lost reason modal
│   │   ├── daily-work/         # BDE action queues, overdue tasks, pending calls
│   │   ├── qualification/      # BANT form drawer, lead scoring indicators
│   │   ├── communication/      # Chronological timeline, call logger, WhatsApp view
│   │   ├── meetings/           # Demo scheduler, attendance tracking
│   │   ├── proposals/          # Proposal builder, PDF preview, version comparison
│   │   ├── customers/          # Customer profiles, active retainers, handoff notes
│   │   ├── analytics/          # Executive dashboard, conversion funnels, rep performance
│   │   └── settings/           # User management, team configuration, pipeline stages
│   │
│   ├── hooks/                  # Global shared custom hooks
│   │   ├── useAuth.ts          # Current user session and role helpers
│   │   ├── useDebounce.ts      # Debounce hook for search inputs
│   │   └── useMediaQuery.ts    # Responsive breakpoint detector
│   │
│   ├── lib/                    # Core utilities and client libraries
│   │   ├── api-client.ts       # Central Axios/Fetch wrapper with JWT interceptors
│   │   ├── query-client.ts     # TanStack Query client configuration
│   │   ├── utils.ts            # Classnames helper (cn), formatters (currency, date)
│   │   └── constants.ts        # Route paths, stage IDs, role enums
│   │
│   ├── mocks/                  # Mock API & Data for standalone development
│   │   ├── browser.ts          # MSW (Mock Service Worker) browser initialization
│   │   ├── handlers/           # Mock REST endpoints (/api/v1/leads, /api/v1/deals)
│   │   └── data/               # Static seed fixtures (leads, users, deals)
│   │
│   └── types/                  # Global TypeScript type declarations & DTOs
│       ├── api.d.ts            # Standard API response wrappers & error types
│       ├── auth.d.ts           # User, Session, Role, Permission definitions
│       └── domain.d.ts         # Lead, Deal, Task, Activity, Proposal interfaces
```

---

## 2. Routing & Layout Strategy (Target Model)

### 2.1 Route Definitions
* `/login` & `/forgot-password`: Unauthenticated `AuthLayout`.
* `/dashboard`: Default home screen loading the **BDE Daily Work Dashboard** (for reps) or **Executive Dashboard** (for managers).
* `/leads`: Lead management table with server-side filtering, sorting, and pagination.
* `/leads/:id`: Detailed 360-degree Lead View (Tabs: Overview, Qualification, Timeline, Proposals, Tasks).
* `/pipeline`: Visual Drag-and-Drop Kanban Board.
* `/tasks`: Global task manager and calendar view.
* `/proposals`: Proposal and quotation directory.
* `/customers`: Customer directory and account management.
* `/customers/:id`: Customer 360 profile.
* `/analytics`: Detailed management reporting and funnel analysis.
* `/settings/*`: Team management, user permissions, and CRM configuration.

### 2.2 Layout Composition
* **DashboardLayout:** Renders:
  - Collapsible Sidebar with navigation items scoped to current user role.
  - Top Navigation Bar with global search (`Cmd+K`), active notification bell, user profile menu, and tenant selector.
  - Action Banner: Persistent reminder of today's overdue follow-ups.
  - Main Content Area: Responsive container with standard padding and scroll container.

---

## 3. State Management Architecture

### 3.1 Server State (TanStack Query)
* All remote backend data is managed via TanStack Query.
* Query Keys are strictly namespaced:
  - `['leads', { page, filter, search }]`
  - `['leads', leadId]`
  - `['deals', 'pipeline']`
  - `['tasks', 'daily-queue', userId]`
* **Optimistic Updates:** When moving deal cards across Kanban stages or completing tasks, TanStack Query immediately applies the optimistic mutation to the local cache before server confirmation, rolling back gracefully if the network request fails.

### 3.2 Client State (React Context / Lightweight Stores)
* Client-only state is minimized:
  - `AuthContext`: Authenticated user profile, access token expiration, role checks (`hasRole`, `hasPermission`).
  - `UIContext`: Sidebar collapsed state, active theme (light/dark), global search modal open/closed.

---

## 4. Form Management & Validation

* **Libraries:** React Hook Form + Zod.
* **Approach:**
  - All form schemas are declared using Zod (e.g., `leadCreateSchema`, `qualificationSchema`, `proposalSchema`).
  - TypeScript types are automatically inferred from Zod schemas (`type LeadCreateInput = z.infer<typeof leadCreateSchema>`).
  - Inputs render via shadcn/ui `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, and `FormMessage` components ensuring full WAI-ARIA accessibility.

---

## 5. Mock Data Strategy (Independent Frontend Development)

To guarantee the frontend can be built, reviewed, and validated **without requiring an active backend or database**:
1. **Mock Service Worker (MSW):** Intercepts browser `/api/v1/*` HTTP requests at the network layer.
2. **Deterministic Seed Data:** Complete mock datasets represent diverse lead states (Hot, Warm, Cold, Unqualified, Overdue follow-up, Proposal sent, Deal won).
3. **Toggle via Environment Variable:** `VITE_ENABLE_MOCKS=true` boots MSW in development. Switching to `false` routes requests to the NestJS API without modifying a single line of application code.

---

## 6. Accessibility & Responsive Design Expectations

* **Design System:** Built on Radix UI headless primitives ensuring keyboard navigation (`Tab`, `Escape`, `Arrow` keys), ARIA labels, and screen reader compatibility.
* **Breakpoints:**
  - Mobile (`< 768px`): Bottom navigation bar, collapsed cards, drawer-based filters.
  - Tablet (`768px - 1024px`): Responsive Kanban with horizontal scroll, compact sidebar.
  - Desktop (`> 1024px`): Full multi-column dashboard, split-view lead detail, side-by-side timeline.
* **Performance Budget:** Initial JS bundle size `< 200KB` (gzipped), First Contentful Paint (FCP) `< 1.2s`, Lighthouse Accessibility score $\ge 95$.
