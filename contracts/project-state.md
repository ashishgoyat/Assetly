# Assetly — Project State

## Current status — Iterations A, B, C, D, F, H + post-H polish + settings & account modal complete ✅

### What's built

**Iterations completed:**
- A) Dark mode ✅ — warm cream light / warm espresso dark, class-based via next-themes, `prefers-color-scheme` fallback
- B) Mobile responsive ✅ — slide-in drawer sidebar, 3 breakpoints (<768px / 768–1279px / ≥1280px), all pages stack on mobile
- C) Forms ✅ — New Goal, Add Transaction, Add Bill modals with server actions and Zod validation
- H) Live computations ✅ — all dashboard metrics computed from real DB data (net worth, budgets, goals, transactions)

**Post-post-H additions (2026-05-28, after last state update):**
- Settings page ✅ — `/dashboard/settings` with four sections: Profile (name/email/avatar), Appearance (theme toggle via `SettingsThemeToggle`), Notifications (`SettingsNotifications` with granular toggles), Security (change password + 2FA stub); new types added to `contracts/api-contracts.ts`
- Add Account modal ✅ — "Add Account" button in Sidebar now opens `AddAccountForm` modal; server action `createAccount` in `app/dashboard/accounts/actions.ts` writes to SQLite via Drizzle; balance stored in paise/cents
- Landing page DarkModeToggle ✅ — `DarkModeToggle` added to the landing page nav bar
- DarkModeToggle fix ✅ — rewritten to use `useSyncExternalStore` instead of `setState in useEffect`; eliminates the lint `set-state-in-effect` warning

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
/dashboard/settings   — Profile · Appearance · Notifications · Security
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
- `app/dashboard/accounts/actions.ts` — `createAccount`

**Key components:**
- Layout: Sidebar (collapsible), SidebarContext, Topbar, MobileDrawer, HamburgerButton
- Dashboard: CashOnHandCard, BillRow, TransactionRow, GoalCard (all interactive client components)
- Charts: AreaChart, DonutChart, Sparkline, BarChart (all custom SVG)
- UI: Icon (46 SVGs), Modal, Pill, ProgressBar, MerchantIcon, DarkModeToggle, PeriodSelector
- Forms: NewGoalForm, AddTransactionForm, AddBillForm, AddAccountForm
- Settings: SettingsThemeToggle, SettingsNotifications (client components inside `/dashboard/settings/`)

### Known limitations
1. **Edit/delete** — create only; no edit or delete for any entity
2. **Empty states** — not all page sections have dedicated empty states
3. **Seed transactions only cover April 17–23, 2026** — vsLastMonth returns [] (no March data); budget spentInCents is seeded full-month data, not aggregated from transactions
4. **Quick actions are UI-only** — bill/transaction/goal expand actions are not wired to server actions yet (Pay now, Add funds, etc. are stubs)
5. **Cash on hand period data is mock-only** — `cashFlowDataByPeriod` is hardcoded in mock-data.ts; API route still returns a single `cashFlowData` array

### Last checks (session 2026-05-28)
- pnpm lint: DarkModeToggle `set-state-in-effect` warning resolved (useSyncExternalStore); SidebarContext warning may remain; 0 new errors from settings/account-modal changes
- pnpm build: not re-run after latest additions (settings page, account modal)

---

## Session 2026-05-29

### Workflow change
- CLAUDE.md rewritten to issue-driven fix loop (user reports issue → manager spawns one subagent → review → report back). Replaced the old 5-phase orchestration loop.

### Sidebar
- Toggle button moved from Topbar into the Sidebar brand row (desktop only, `sidebar-toggle` CSS class)
- Collapse now shows a 64px icon-only strip instead of hiding the sidebar entirely
- Collapsed state hides: brand "A" logo mark, "Add account" button, 3-dots icon in user row
- Static badge "3" removed from Transactions nav item
- 3-dots `···` fixed to stretch to far right of user row (`width: 100%` on button)
- Horizontal scroll fixed (`overflow-x: hidden` + `min-width: 0` on `.sidebar`)
- Sign-out icon changed from arrow to logout-door icon (new `logout` icon added to Icon.tsx)

### Header / Topbar
- Sidebar toggle button removed from Topbar (moved to Sidebar)
- Search bar now functional: debounced 300ms, calls `/api/transactions?q=`, dropdown of up to 6 results, ⌘K shortcut, Escape/click-outside to close
- Notifications bell now functional: fetches `/api/notifications`, panel with unread count badge, relative timestamps, "Mark all read", click-outside to close

### New API endpoints
- `GET /api/notifications` — returns `Notification[]` (static seed data, 6 entries)
- `GET /api/transactions?q=searchText` — text search across merchant + category (added to existing endpoint)

### Transactions page — full overhaul
- Dark mode: selected category pill text changed from `white` to `var(--bg)` (always readable)
- Filter button: opens dropdown with Type (income/expense) and Status (posted/pending) filters; active indicator dot on button
- Month button: derives available months from loaded data, dropdown picker
- Export CSV button: downloads currently filtered rows as `.csv`
- Transaction detail panel — fully editable in edit mode:
  - Edit / Cancel (full-size, no X in edit mode) / Save changes buttons
  - Merchant (text input), Category (select), Account (select from `/api/accounts`), Status (select)
  - Date row removed; Recategorize and Split buttons removed
  - Save calls `updateTransactionAction` → updates row in list in-place
- Delete transaction: red Delete button with trash icon (text left, icon right); `deleteTransaction` server action + `removeTransaction` in store
- `updateTransactionAction` server action + `updateTransaction` in store

### New icons added to Icon.tsx
- `logout` — door with exit arrow (used in sidebar sign-out)
- `trash` — bin with lid (used in delete transaction button)

### Dark mode / style fixes
- Brand mark "A": `color: white` → `color: var(--bg)` (visible in both modes)
- `btn-primary:hover`: added `color: white` (fixes Add Transaction + Save Changes hover text in dark mode)
- Account select width in edit mode: `100%` → `60%` (consistent with Category/Status fields)

### Last checks (session 2026-05-29)
- pnpm lint: passed (all agents confirmed 0 errors)
- pnpm build: passed (backend agent confirmed after updateTransaction changes)

---

## Session 2026-05-29 (continued)

### What was built / fixed

- **Budgets page — client component rewrite** (`app/dashboard/budgets/page.tsx`): converted from Server Component to Client Component; adds month picker dropdown (last 12 months), loading skeleton, error/empty states, and a `BudgetCard` sub-component with a dots-menu for inline limit editing and delete.
- **Budget cards — edit limit + delete** (`app/dashboard/budgets/page.tsx`): each budget card now has a ⋯ dropdown; "Edit limit" reveals an inline input+save; "Delete" calls `deleteBudget` and removes the card optimistically.
- **NewBudgetButton — real form** (`app/dashboard/budgets/NewBudgetButton.tsx`): replaced the "coming soon" stub with a fully wired modal form (name, category, monthly limit, icon picker, color picker); calls `createBudget` server action; emits `budget-created` event to trigger page re-fetch.
- **Budget server actions** (`app/dashboard/budgets/actions.ts`, new file): `createBudget`, `updateBudgetLimit`, `deleteBudget` server actions with Zod validation.
- **Budgets API — month param** (`app/api/budgets/route.ts`): `GET /api/budgets?month=YYYY-MM` now accepts a client-selected month; computes `daysLeft` relative to today (0 for past months, full for future); heatmap covers exact calendar days of selected month instead of a fixed 30-day window.
- **Goals page — client component rewrite** (`app/dashboard/goals/page.tsx`): converted from Server Component to Client Component; adds `GoalCard` sub-component with dots-menu (Add funds, Adjust monthly, Delete), loading skeleton, error state, empty state.
- **Goal server actions** (`app/dashboard/goals/actions.ts`): added `addFundsToGoal`, `updateGoalMonthly`, and `deleteGoal` server actions; recalculate `percentageComplete` and `eta` on mutation.
- **Store — goal + budget DB helpers** (`lib/data/store.ts`): added `getGoalById`, `updateGoal`, `removeGoal`, `insertBudget`, `updateBudget`, `removeBudget`.

### Known limitations / pending
1. **Edit/delete for bills** — create only; no edit or delete for bills
2. **Seed transactions only cover April 17–23, 2026** — vsLastMonth returns []; budget spentInCents is seeded, not aggregated from transactions
3. **Quick actions for bills** — bill Pay now / Schedule not wired to server actions yet
4. **Cash on hand period data is mock-only** — `cashFlowDataByPeriod` is hardcoded; API returns single array

### Last checks
- pnpm lint: not run
- pnpm build: not run

---

## Next session — choose an iteration

E) Edit/delete for bills
G) Empty states + polish — remaining zero-data empty states
I) Wire bill quick actions — Pay now / Schedule to real server actions

---

## Session 2026-05-30

### What was built / fixed
- **Budget daily calendar — day number visibility fix** (`app/dashboard/budgets/page.tsx` line 554): day number text on low-intensity cells (cream background) was invisible in dark mode because `--ink-2` in dark mode is `#c4b89e` (tan), nearly indistinguishable from the `#f5edd9` cream cell background. Fixed by using `#1c1a16` (dark brown) for cells with intensity > 0.1.
- **Budget daily calendar — today's day number fix** (`app/dashboard/budgets/page.tsx` line 554): removed `isToday` from the color condition; it was forcing white text on today's cell regardless of background intensity. Today (the 30th) had a cream background but white text — making it invisible. Today's cell is already distinguished by its border and bold font weight.

### Known limitations / pending
1. Edit/delete for bills — create only; no edit or delete for bills
2. Seed transactions only cover April 17–23, 2026 — vsLastMonth returns []; budget spentInCents is seeded, not aggregated from transactions
3. Quick actions for bills — bill Pay now / Schedule not wired to server actions yet
4. Cash on hand period data is mock-only — cashFlowDataByPeriod is hardcoded; API returns single array

### Last checks
- pnpm lint: passed
- pnpm build: not run

---

## Session 2026-05-30 (continued)

### What was built / fixed
- **Bills page — client component rewrite** (`app/dashboard/bills/page.tsx`): converted from Server Component to Client Component; fetches `GET /api/bills?days=period`; 30d/60d/90d period buttons switch the window and re-fetch; dynamic timeline with real date labels computed from today; bill list filtered to selected period; "Edit" inline panel per bill row (name, amount, due date, days until due, category, auto-pay) with Save/Cancel/Delete; loading skeletons, error state with retry, empty state.
- **Bills API — period filter** (`app/api/bills/route.ts`): `GET /api/bills?days=30|60|90`; filters bills to `dueInDays <= days`; returns `periodDays` and `totalDuePeriodInCents`; contract field `totalDueNext30DaysInCents` renamed to `totalDuePeriodInCents`.
- **Store — bill + subscription mutations** (`lib/data/store.ts`): added `updateBill`, `removeBill`, `insertSubscription`, `updateSubscription`, `removeSubscription`.
- **Bills actions — update/delete bills** (`app/dashboard/bills/actions.ts`): added `updateBillAction`, `deleteBillAction`; added `createSubscription`, `updateSubscriptionAction`, `deleteSubscriptionAction`; fixed `formData.get()` null→undefined bug via `val()` helper (Zod `.optional()` rejects null, causing "expected string, received null" errors when optional fields absent from form).
- **Subscriptions section — fully editable** (`app/dashboard/bills/page.tsx`): each subscription row gets a ⋯ button expanding an inline edit panel (name, amount/mo, next date, in-use toggle) with Save/Cancel/Delete; "+" button in header opens an inline Add form; optimistic delete; re-fetch on save/add.
- **formData null bug fix — all action files** (`app/dashboard/budgets/actions.ts`, `goals/actions.ts`, `transactions/actions.ts`, `accounts/actions.ts`): added `val()` helper and replaced all `formData.get()` calls to prevent Zod `.optional()` failures on missing form fields.
- **Settings API** (`app/api/settings/route.ts`): new `GET /api/settings`; reads name/email from NextAuth session; returns `UserSettings` contract shape (profile, notifications defaults, security defaults); 401 on unauthenticated request.
- **Settings page — dynamic** (`app/dashboard/settings/page.tsx`): converted from fully static to client component fetching `/api/settings`; profile section shows real name/email/initials/currency/timezone; security section reflects real 2FA state and password-change date; loading skeleton; error state with retry.
- **Contract update** (`contracts/api-contracts.ts`): `BillsSummary.totalDueNext30DaysInCents` → `totalDuePeriodInCents`; added `periodDays: number`.

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — vsLastMonth returns []; budget spentInCents is seeded, not aggregated from transactions
2. Cash on hand period data is mock-only — cashFlowDataByPeriod is hardcoded; API returns single array
3. Settings PATCH not implemented — profile/notifications/security fields are read-only

### Last checks
- pnpm lint: passed
- pnpm build: not run
