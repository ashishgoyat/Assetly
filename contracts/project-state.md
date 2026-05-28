# Assetly — Project State

## Current status — Iterations A, B, C, D, F, H + post-H polish complete ✅

### What's built

**Iterations completed:**
- A) Dark mode ✅ — warm cream light / warm espresso dark, class-based via next-themes, `prefers-color-scheme` fallback
- B) Mobile responsive ✅ — slide-in drawer sidebar, 3 breakpoints (<768px / 768–1279px / ≥1280px), all pages stack on mobile
- C) Forms ✅ — New Goal, Add Transaction, Add Bill modals with server actions and Zod validation
- H) Live computations ✅ — all dashboard metrics computed from real DB data (net worth, budgets, goals, transactions)

**Post-H bug fixes & polish (2026-05-28):**
- Sidebar collapse ✅ — toggleable sidebar with smooth animation; state persisted in localStorage via `SidebarContext`
- Login/signup ✅ — submit button height fixed on login and signup pages
- All buttons wired ✅ — previously non-functional buttons and clickables across the full app now route or trigger correctly
- Dashboard home interactions ✅ (see detail below)

**Dashboard home — interactive sections added:**
- **Sidebar sign-out** — removed standalone sign-out row; 3-dots (`···`) on the user row opens a dropdown with Sign out in red; closes on outside click
- **Cash on hand period toggle** — `1W / 1M / 3M / 1Y` buttons now switch chart data and axis labels (was UI-only before); data provided via `cashFlowDataByPeriod` on the contract
- **Upcoming bills quick actions** — click any bill row to expand: *Pay now / Schedule* (non-auto-pay) or *Edit auto-pay* (auto-pay) + *View history · Skip this month*
- **Recent activity quick actions** — click any transaction row to expand: *Categorize · Add note · Split · Exclude*
- **Saving goals quick actions** — click any goal card to expand: *Add funds · Adjust monthly · Pause*
- **Where it went header** — replaced 3-dots icon with "View insights" text + chevron, consistent with other section headers

**Stack:**
- Next.js 16 (App Router) + React 19 + TypeScript strict
- Tailwind CSS v4 (CSS-first config)
- next-themes v0.4.6 (dark mode)
- Zod v4.4.3 (validation)
- SQLite (`assetly.db`) + Drizzle ORM + `@libsql/client` (WASM, no native build step)
- NextAuth.js v5 (Auth.js beta) — credentials provider, JWT sessions
- bcryptjs — password hashing
- Caveat (Google Fonts) — sketch/hand-drawn display font

**All routes:**
```
/ → Public marketing landing page (hero, features, how-it-works, CTA, footer) — links to /login and /signup
/login                — Login page (email + password)
/signup               — Signup page (name + email + password + confirm)
/dashboard            — Home: safe-to-spend, cash on hand chart, upcoming bills, recent activity, saving goals, where-it-went donut
/dashboard/transactions — Paginated list with category filter + detail panel + Add Transaction
/dashboard/budgets    — Donut chart + monthly heatmap + budget bars
/dashboard/goals      — Progress cards + New Goal modal
/dashboard/bills      — Timeline + subscriptions grid + Add Bill modal
/dashboard/insights   — Insight cards with featured pinned insight
/dashboard/accounts/[id] — Account detail (chase | ally | broker)
/api/auth/[...nextauth] — NextAuth.js handler
/api/dashboard        — DashboardSummary (reads user name from session)
/api/transactions     — Paginated + filtered TransactionsSummary
/api/budgets          — BudgetSummary[]
/api/goals            — GoalSummary[]
/api/bills            — BillsSummary
/api/insights         — Insight[]
/api/accounts         — Account[]
/api/accounts/[id]    — AccountDetail
```

**Server actions:**
- `app/dashboard/goals/actions.ts` — `createGoal`
- `app/dashboard/transactions/actions.ts` — `createTransaction`
- `app/dashboard/bills/actions.ts` — `createBill`

**Key components:**
- Layout: Sidebar (collapsible), SidebarContext, Topbar, MobileDrawer, HamburgerButton
- Dashboard: CashOnHandCard, BillRow, TransactionRow, GoalCard (all interactive client components)
- Charts: AreaChart, DonutChart, Sparkline, BarChart (all custom SVG)
- UI: Icon (46 SVGs), Modal, Pill, ProgressBar, MerchantIcon, DarkModeToggle, PeriodSelector
- Forms: NewGoalForm, AddTransactionForm, AddBillForm

### Known limitations
1. **Edit/delete** — create only; no edit or delete for any entity
2. **Empty states** — not all page sections have dedicated empty states
3. **Seed transactions only cover April 17–23, 2026** — vsLastMonth returns [] (no March data); budget spentInCents is seeded full-month data, not aggregated from transactions
4. **Quick actions are UI-only** — bill/transaction/goal expand actions are not wired to server actions yet (Pay now, Add funds, etc. are stubs)
5. **Cash on hand period data is mock-only** — `cashFlowDataByPeriod` is hardcoded in mock-data.ts; API route still returns a single `cashFlowData` array

### Last checks (session 2026-05-28)
- pnpm lint: pre-existing DarkModeToggle / SidebarContext lint warnings only (set-state-in-effect); 0 new errors from recent changes
- pnpm build: not re-run this session — last clean build was 2026-05-28 pre-polish

---

## Next session — choose an iteration

E) Edit/delete — edit and delete actions for transactions, goals, bills
G) Empty states + polish — skeleton loading refinements, zero-data empty states for all sections
I) Wire quick actions — connect bill Pay now / Schedule, transaction Categorize / Add note, goal Add funds / Pause to real server actions
