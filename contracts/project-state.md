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

---

## Session 2026-05-30 (settings + greeting)

### What was built / fixed
- **Settings — Edit Profile modal** (`app/dashboard/settings/page.tsx`): "Edit Profile" button now opens a modal with name, currency dropdown (USD/INR/EUR), and timezone fields; saving calls `updateProfile` server action; on success propagates new currency via `useSetCurrency()` so all client pages re-render immediately.
- **Settings — Change Password modal** (`app/dashboard/settings/page.tsx`): "Change password" opens a modal with current/new/confirm fields, client-side match validation, 8-char minimum; calls `updatePassword` action; shows brief success message before close.
- **Settings — Delete Account modal** (`app/dashboard/settings/page.tsx`): "Delete account" opens a confirmation modal requiring password; calls `deleteAccount` action; redirects to `/` on success.
- **Settings — Sign Out All** (`app/dashboard/settings/page.tsx`): "Sign out all" button confirms via `window.confirm`, calls `signOutAllSessions`, redirects to `/login`.
- **Settings — Export All Data** (`app/dashboard/settings/page.tsx`): "Export all data" calls `exportUserData` and downloads a JSON blob (`assetly-export-YYYY-MM-DD.json`) containing profile, transactions, accounts, budgets, goals, bills, subscriptions.
- **Settings — 2FA toggle** (`app/dashboard/settings/page.tsx`): "Enable" / "Manage" button toggles cookie-backed 2FA state via `toggle2FA` action and re-fetches.
- **Currency context** (`app/contexts/CurrencyContext.tsx`, NEW): `CurrencyProvider`, `useCurrency`, `useSetCurrency` hooks; persists to `assetly-currency` cookie so server-side reads work too.
- **Providers — currency wired** (`app/providers.tsx`, `app/layout.tsx`): root layout reads currency cookie server-side and passes `initialCurrency` to a new CurrencyProvider wrapping all client pages.
- **Currency propagation across client pages** (`app/dashboard/bills/page.tsx`, `budgets/page.tsx`, `goals/page.tsx`, `transactions/page.tsx`, `bills/SavingsOpportunityCard.tsx`, `components/dashboard/BillRow.tsx`, `components/dashboard/TransactionRow.tsx`): each calls `useCurrency()` and passes the currency to all `formatCurrency`/`formatCurrencyExact` calls so the user-selected currency takes effect across the whole app.
- **Settings server actions** (`app/dashboard/settings/actions.ts`, NEW): `updateProfile`, `updatePassword`, `deleteAccount`, `signOutAllSessions`, `exportUserData`, `toggle2FA`; all Zod-validated with proper session checks; currency/timezone/2FA/lastPasswordChange persisted via cookies (1yr max-age) rather than a DB schema change.
- **Server prefs helper** (`lib/server-prefs.ts`, NEW): `getCurrencyServer`, `getTimezoneServer`, `getTwoFactorEnabledServer` for reading user preferences from cookies in server components.
- **User store helpers** (`lib/data/store.ts`): added `getUserById`, `updateUser`, `removeUser` for profile/password/account-deletion flows.
- **Settings API enriched** (`app/api/settings/route.ts`): now reads fresh name/email from DB via `getUserById(session.user.id)` rather than session-only, and pulls currency/timezone/2FA/lastPasswordChange from cookies.
- **Auth session id exposed** (`auth.ts`): session callback now copies `token.id` onto `session.user.id` so server actions can identify the current user.
- **Dashboard greeting — dynamic name + time of day** (`app/dashboard/page.tsx`): page now calls `auth()` directly (the server-side fetch to `/api/dashboard` didn't carry session cookies, so name fell back to "You"); reads `assetly-timezone` cookie and computes the current hour via `Intl.DateTimeFormat` to choose between Late night / Early morning / Good morning / Good afternoon / Good evening; uses just the first name for a natural greeting.

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — vsLastMonth returns []; budget spentInCents is seeded, not aggregated from transactions
2. Cash on hand period data is mock-only — cashFlowDataByPeriod is hardcoded; API returns single array
3. Currency propagation in server components — `app/dashboard/page.tsx` and `app/dashboard/accounts/[id]/page.tsx` still hardcode USD for currency formatting (need a server-side cookie read pass)
4. JWT session can't be individually revoked — "Sign out all" only signs out the current session
5. 2FA is cookie-backed stub — no real TOTP/SMS flow implemented
6. Contract `UserSettings.profile.currency` is `'USD' | 'INR'` but actions accept `'USD' | 'INR' | 'EUR'` — cast at API boundary; manager should widen the contract type

### Last checks
- pnpm lint: passed
- pnpm build: not run

---

## Session 2026-05-30 (home page UI polish)

### What was built / fixed
- **Due Soon card** (`app/dashboard/page.tsx`, `app/globals.css`): added new `.card-hoverable` CSS class (lift + box-shadow + border darkening on hover); `ActionCard` no longer renders a CTA button for `bill` type cards — clicking the whole card navigates to `/dashboard/bills` via the existing Link wrapper. Insight/todo cards still render their CTAs.
- **Settings icon removed** (`app/components/layout/Topbar.tsx`): removed the non-functional cog button from the right side of the topbar.
- **Cash on hand chart — fully dynamic** (`app/api/dashboard/route.ts`, `app/components/dashboard/CashOnHandCard.tsx`): API now walks real transactions backwards from current cash to reconstruct a balance-over-time series; samples 1W = 7 daily points, 1M = 30 daily, 3M = 13 weekly, 1Y = 12 monthly; CashOnHandCard reads dynamic axis labels from a new `cashFlowLabelsByPeriod` prop so the X-axis updates with real "Today"-relative dates when the user toggles periods.
- **Contract — cash flow labels** (`contracts/api-contracts.ts`): added `cashFlowLabelsByPeriod: Record<'1W' | '1M' | '3M' | '1Y', string[]>` to `DashboardSummary.cashOnHand`.
- **Mock data** (`lib/mock-data.ts`): added matching `cashFlowLabelsByPeriod` to MOCK_DASHBOARD so the dev fallback still satisfies the contract.
- **Quick-action server actions** (`app/dashboard/home-actions.ts`, NEW): `payBill` (inserts expense + removes bill), `skipBill` (dueInDays += 30), `setTransactionCategory`, `setTransactionNote`, `excludeTransaction`, `addFundsToGoalAction` (recomputes percentage + ETA), `setGoalMonthly` (recomputes ETA), `pauseGoal` (monthly = 0, ETA = "Paused"). All Zod-validated with integer-cent math.
- **Upcoming bills quick actions** (`app/components/dashboard/BillRow.tsx`): Pay now calls `payBill` and optimistically lifts the row via `onPaid`; Schedule + Edit auto-pay are now `<Link>`s to `/dashboard/bills`; View history deep-links to `/dashboard/transactions?q=<billName>`; Skip this month calls `skipBill`. Inline error + aria-busy + disabled states during mutations.
- **Recent activity quick actions** (`app/components/dashboard/TransactionRow.tsx`): Categorize opens an inline `<select>` of all 13 `TransactionCategory` values with Apply/Cancel — calls `setTransactionCategory`, updates the row's subtitle on success; Add note opens an inline text input with Save/Cancel — calls `setTransactionNote`; Split links to `/dashboard/transactions`; Exclude calls `excludeTransaction` and lifts via `onExcluded`.
- **Saving goals quick actions** (`app/components/dashboard/GoalCard.tsx`): Add funds opens inline `$` input + Add/Cancel — calls `addFundsToGoalAction`; Adjust monthly opens inline `$` input + Save/Cancel — calls `setGoalMonthly`; Pause calls `pauseGoal`. All three reload the page after success (parent is a Server Component, so refetch can't be lifted).

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — vsLastMonth returns []; budget spentInCents is seeded, not aggregated from transactions
2. Currency propagation in server components — `app/dashboard/page.tsx` and `app/dashboard/accounts/[id]/page.tsx` still hardcode USD for currency formatting (need a server-side cookie read pass)
3. JWT session can't be individually revoked — "Sign out all" only signs out the current session
4. 2FA is cookie-backed stub — no real TOTP/SMS flow implemented
5. Contract `UserSettings.profile.currency` is `'USD' | 'INR'` but actions accept `'USD' | 'INR' | 'EUR'` — cast at API boundary; manager should widen the contract type
6. Pay now uses `accountLabel: 'Auto'` — should ideally pick the user's default account
7. GoalCard quick actions reload the full page on success — should use a parent-side refetch when the goals list moves to a Client Component

### Last checks
- pnpm lint: passed
- pnpm build: not run

---

## Session 2026-05-31 (budgets aggregation + clickable cards)

### What was built / fixed
- **Budgets API — real transaction aggregation** (`app/api/budgets/route.ts`): `Budget.spentInCents` is no longer read from the seeded DB column; for each budget it's now summed from real `expense` transactions whose `category` matches the budget's `category` and whose `date` falls inside the selected month (`?month=YYYY-MM`, default = latest tx date / today). `percentageUsed`, `isOver`, and `BudgetSummary.totalSpentInCents` are recomputed from the new values. Response shape unchanged.
- **payBill — Bills category enforced** (`app/dashboard/home-actions.ts`): inserted transaction now hardcoded to `category: 'Bills'` so it counts against a Bills budget; added `revalidatePath('/dashboard/budgets')`.
- **paySubscription server action** (`app/dashboard/home-actions.ts`, NEW): Zod-validates id, inserts an `expense` transaction with `category: 'Subscriptions'`, merchant = subscription name, amount = `amountMonthlyInCents`, status `posted`, account `'Auto'`; advances `nextDate` by 30 days; revalidates `/dashboard`, `/dashboard/bills`, `/dashboard/budgets`. Returns `ActionResult` to match the file convention.
- **Budgets page — whole-card click target** (`app/dashboard/budgets/page.tsx`): `BudgetCard` ⋯ dropdown removed; entire card is now `role="button"` + `tabIndex={0}` with Enter/Space activation; click toggles an inline edit panel (limit input + Save + Cancel + Delete). `.card-hoverable` applied while collapsed. `aria-expanded` reflects state.
- **Goals page — whole-card click target** (`app/dashboard/goals/page.tsx`): `GoalCard` ⋯ dropdown removed; entire card clickable + keyboard-activatable; expanded panel surfaces Add funds / Adjust monthly / Delete, then swaps in the inline form. `.card-hoverable` applied while collapsed.
- **Bills page — clickable bill rows and subscription tiles** (`app/dashboard/bills/page.tsx`): `BillRow` and `SubRow` converted to `<button>` containers — the standalone "Edit" toggle and "⋯" trigger removed. Click anywhere on the row/tile opens the existing inline edit panel (Save / Cancel / Delete unchanged). `.card-hoverable` applied while collapsed.
- **Transactions page — single-mode edit panel** (`app/dashboard/transactions/page.tsx`): the inner "Edit" button removed from the detail panel; row click now opens the panel directly with all fields editable. Header label updated to "Edit transaction". Save / Cancel / Delete preserved.

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation will read $0 outside that window unless real transactions are added
2. Cash on hand period data is mock-only — `cashFlowDataByPeriod` hardcoded; API returns single array
3. Currency propagation in server components — `app/dashboard/page.tsx` and `app/dashboard/accounts/[id]/page.tsx` still hardcode USD
4. JWT session can't be individually revoked — "Sign out all" only signs out the current session
5. 2FA is cookie-backed stub — no real TOTP/SMS flow implemented
6. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
7. Subscription pay button is not yet wired in the UI — `paySubscription` exists but no caller yet

### Last checks
- pnpm lint: passed (both agents)
- pnpm build: passed (backend agent, 22 routes)

---

## Session 2026-05-31 (motion system + exit animations + theme crossfade)

### What was built / fixed
- **Centralized motion tokens** (`app/globals.css` `:root` lines 67–82): `--dur-instant: 120ms`, `--dur-fast: 220ms`, `--dur-base: 320ms`, `--dur-slow: 480ms`, `--ease-out-quart: cubic-bezier(0.22, 1, 0.36, 1)`, `--ease-in-out-quart`, `--ease-spring`. Bridged into Tailwind v4 via `@theme` so `duration-fast`/`ease-out-quart` resolve to these vars. Legacy `--t-sm` retained as alias.
- **Reusable `.anim-*` classes** (`app/globals.css`): `.anim-fade-in`, `.anim-slide-up`, `.anim-slide-down`, `.anim-scale-in`, `.anim-pop`, `.anim-enter`, `.anim-collapsible` (grid-rows trick — animates both directions), `.press-feedback`. Plus matching keyframes — every existing transition/keyframe in `globals.css` was refactored to consume the tokens.
- **`prefers-reduced-motion: reduce` guard** (`app/globals.css` ~line 1005): redeclares every duration token to `0.01ms`; universal `* { animation-duration / transition-duration: 0.01ms !important }`; explicit `animation: none !important` on every `.anim-*` class, `[data-exiting="true"]`, `.drawer`, `.modal-*`, `.skeleton`, and `html.theme-transitioning *`.
- **Motion applied across app**: sidebar collapse + drawer + user menu, modal backdrop/panel, notifications panel, search dropdown, transactions filter/month + detail panel, budgets month picker, all inline edit panels (Budgets/Goals/Bills/Subs), `AddSubForm` mount, form-field focus, button press feedback. `.card-hoverable` re-routed through tokens.
- **Form-file inline transitions cleaned up** (`app/components/forms/AddBillForm.tsx`, `AddTransactionForm.tsx`, `NewGoalForm.tsx`, `app/dashboard/goals/NewGoalButton.tsx`): replaced ad-hoc `transition: "all var(--t-sm)"` with explicit narrow-property token transitions.
- **Theme toggle crossfade** (`app/lib/applyThemeWithTransition.ts`, NEW): adds `theme-transitioning` class to `<html>`, calls `setTheme`, removes the class after 350ms. CSS rule `html.theme-transitioning *` applies `transition: background-color, border-color, color, fill, stroke var(--dur-base) var(--ease-in-out-quart) !important` so the whole UI crossfades over ~320ms. Hover transitions stay snappy outside the swap window. Both `DarkModeToggle.tsx` and `SettingsThemeToggle.tsx` now wrap their `setTheme` calls.
- **Home dashboard row expansions smoothed** (`app/components/dashboard/BillRow.tsx`, `TransactionRow.tsx`, `GoalCard.tsx`): the `{expanded && <panel>}` instant-mount pattern replaced with `.anim-collapsible[data-open]` + `.anim-collapsible-inner` — same pattern as the tab pages. Animates both open and close natively via `grid-template-rows: 0fr ↔ 1fr`.
- **`useExitAnimation` hook** (`app/hooks/useExitAnimation.ts`, NEW): centralized exit-animation primitive. Exports `MOTION_MS = { instant: 120, fast: 220, base: 320, slow: 480 }` (JS↔CSS duration parity) and `useExitAnimation(isOpen, durationMs)` returning `{ shouldRender, isExiting }`. Uses React 19 setState-during-render to detect prop transitions (avoids `set-state-in-effect` lint rule). Short-circuits under `prefers-reduced-motion` for immediate unmount.
- **Exit-animation CSS** (`app/globals.css`): new keyframes `anim-pop-exit`, `anim-fade-out`, `anim-scale-out`, `anim-slide-in-right`, `anim-slide-out-right`. `[data-exiting="true"]` selectors for `.anim-pop / .anim-fade-in / .anim-scale-in / .anim-slide-in-right / .modal-overlay / .modal-panel` swap in the reverse keyframe. Reduced-motion block neutralizes them all.
- **Transaction detail panel slide-in-from-right** (`app/dashboard/transactions/page.tsx`): aside root changed from `.anim-fade-in` to `.anim-slide-in-right` + `data-exiting`. Gated on `shouldRender` from `useExitAnimation(Boolean(selected), MOTION_MS.base)`. Added `panelTx` state to keep content during exit window; grid track follows `shouldRender` so panel doesn't squish mid-exit.
- **Popover exit animations wired** (6 sites): transactions filter dropdown + month picker, budgets month picker, sidebar user menu, search results listbox, notifications panel — each now `{shouldRender && <X data-exiting={…}/>}` driven by the hook.
- **Modal API refactor** (`app/components/ui/Modal.tsx`): now `<Modal open title onClose>`; component owns its own mount/unmount via `useExitAnimation(open, MOTION_MS.base)`. Backdrop fades out + panel scales out on close. All 8 callsites updated across 6 files: `NewGoalButton`, `NewBudgetButton`, `AddBillButton`, `AddTransactionButton`, `Sidebar` (Add Account), `settings/page.tsx` (Edit Profile / Change Password / Delete Account).

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. Cash on hand period data is mock-only — `cashFlowDataByPeriod` hardcoded; API returns single array
3. Currency propagation in server components — `app/dashboard/page.tsx` and `app/dashboard/accounts/[id]/page.tsx` still hardcode USD
4. JWT session can't be individually revoked — "Sign out all" only signs out the current session
5. 2FA is cookie-backed stub — no real TOTP/SMS flow implemented
6. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
7. Subscription pay button is not yet wired in the UI — `paySubscription` exists but no caller yet
8. Subtle `<Modal>` API churn — the prop change is mechanical, but any future modal callsite must use `<Modal open …/>`, not `{open && <Modal …/>}`

### Last checks
- pnpm lint: passed
- pnpm build: passed (22 routes)

---

## Session 2026-06-01 (Google OAuth, data isolation, notifications, settings overhaul)

### What was built / fixed

**Auth — Google OAuth replacing credentials:**
- `auth.ts` rewritten: removed Credentials + bcryptjs, added Google provider; `signIn` callback upserts user via `upsertGoogleUser`; JWT callback validates `sessionVersion` on every read (returns `null` to force logout on mismatch); session callback exposes `id` + `avatarUrl`.
- `lib/db/schema.ts`: added `googleId`, `avatarUrl`, `sessionVersion` columns to `usersTable`; made `passwordHash` nullable; added `notificationReadsTable` and `notificationEmailsSentTable` with composite PKs; added `userId` TEXT to all 6 data tables (transactions, accounts, budgets, goals, bills, subscriptions) for per-user isolation.
- `lib/db/index.ts`: `migrateUsersTable()` for rename-and-recreate migration; `addColumnIfMissing()` helper; `ensureDb()` now only calls `initTables()` — seed call removed so fresh accounts start empty.
- `lib/data/store.ts`: added `getUserByGoogleId`, `upsertGoogleUser`, `getSessionVersion`, `incrementSessionVersion`; all query functions filter by `userId`; `computeDueInDays()` computes bill due-days live from `dueDate` string; `generateNotifications(userId, prefs)` produces real `Notification[]` from DB (bill_due, budget_exceeded, large_transaction, goal_milestone, weekly_digest); read/email tracking helpers (`getNotificationReads`, `markNotificationRead`, `markAllNotificationsRead`, `getEmailedNotifications`, `recordEmailedNotification`).

**Notifications — dynamic + email delivery:**
- `app/api/notifications/route.ts`: replaced static seed with `generateNotifications` + `getNotificationReads`; merges `isRead` state.
- `app/api/notifications/[id]/read/route.ts` (NEW): PATCH — calls `markNotificationRead`.
- `app/api/notifications/read-all/route.ts` (NEW): POST — calls `markAllNotificationsRead`.
- `lib/email.ts` (NEW): Resend client + `sendNotificationEmail(notification, toEmail)` per notification type.
- `app/api/cron/notifications/route.ts` (NEW): CRON_SECRET-gated GET; generates notifications respecting prefs; skips already-emailed IDs; `?force=true` clears history; returns `{ sent, skipped, generated }`.
- `app/components/layout/Topbar.tsx`: notification panel re-fetches every time it opens (not just on mount); unread-first sort order.

**Settings overhaul:**
- `app/dashboard/settings/page.tsx`: removed 2FA section and Change Password modal; Google profile picture in profile section; timezone field replaced with grouped IANA timezone `<select>` (~30 options); delete-account confirmation changed from password input to typing "DELETE" (uppercase enforced); passes `settings.notifications` to `SettingsNotifications` as `initialPrefs`.
- `app/dashboard/settings/SettingsNotifications.tsx`: rewritten as fully controlled component; each toggle calls `updateNotificationPrefs` fire-and-forget; "Send test email" button calls `sendTestNotificationEmail()` with success/error feedback.
- `app/dashboard/settings/actions.ts`: added `updateNotificationPrefs` (Zod-validated, writes `assetly-notif-prefs` JSON cookie); added `sendTestNotificationEmail` (clears emailed history, force-sends all current notifications); `signOutAllSessions` now calls `incrementSessionVersion` to revoke all JWTs; `deleteAccount` no longer requires password; removed `updatePassword` and `toggle2FA`.
- `lib/server-prefs.ts`: added `getNotificationPrefsServer()` reading `assetly-notif-prefs` JSON cookie with `DEFAULT_PREFS` fallback.

**Insights removed:**
- `app/api/insights/route.ts` deleted.
- `app/dashboard/insights/page.tsx` deleted.
- Insights nav item removed from `Sidebar.tsx`.
- "View insights" link removed from `app/dashboard/page.tsx`.

**Login / landing page:**
- `app/(auth)/login/page.tsx`: replaced email/password form with single "Continue with Google" button; card widened to `max-w-md`.
- `app/(auth)/signup/page.tsx`: server component that redirects to `/login`.
- `app/page.tsx`: removed "Log in" / "Sign in" dual buttons from nav; single "Sign in" → `/login`; hero and CTA buttons point to `/login`.

**Sidebar:**
- Shows Google profile picture when `userAvatarUrl` is set, falls back to initials.
- Three-dots icon removed from user row bottom.

**Settings illustration:**
- `app/dashboard/settings/SettingsIllustration.tsx` (NEW): inline SVG React component rendering a settings card mockup (profile row, 4 toggle rows, buttons, floating mini card, decorative rings/dots); theme-aware palette — light uses white/gray, dark uses warm charcoal-brown (no blue tint); rendered fixed bottom-right, stays in place while scrolling; only mounts client-side to avoid hydration mismatch.

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. Cash on hand period data is mock-only — `cashFlowDataByPeriod` hardcoded; API returns single array
3. Currency propagation in server components — `app/dashboard/page.tsx` and `app/dashboard/accounts/[id]/page.tsx` still hardcode USD
4. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
5. Subscription pay button not wired in UI — `paySubscription` exists but has no caller
6. Cron email endpoint requires external scheduler (cron-job.org / GitHub Actions) — no built-in scheduler

### Last checks
- pnpm lint: passed
- pnpm build: not run

---

## Session 2026-06-01 (active session tracking + email notifications post-mutation)

### What was built / fixed
- **Active session tracking** (`auth.ts`, `lib/db/schema.ts`, `lib/db/index.ts`, `lib/data/store.ts`): session validity now enforced via `sessionVersion`; JWT callback validates version on every read and returns `null` to force logout on mismatch; `signOutAllSessions` calls `incrementSessionVersion` to revoke all existing JWTs across devices.
- **Suggestion cards removed** (`app/dashboard/bills/page.tsx`, `app/dashboard/budgets/page.tsx`): deleted `SavingsOpportunityCard.tsx` and `BudgetSuggestionCard.tsx`; replaced with inline fields computed server-side.
- **Bills API — savings opportunity** (`app/api/bills/route.ts`): computes `savingsOpportunityInCents` and `savingsOpportunityNote` from unused subscriptions; both fields added to `BillsSummary` contract.
- **Dashboard API — dynamic actions** (`app/api/dashboard/route.ts`): `daysRemainingInMonth` util added to calculations; `actions` array now dynamically derived (most urgent bill, budget status, goal progress) instead of static.
- **Email notifications post-mutation** (`lib/email.ts`, `app/dashboard/budgets/actions.ts`, `app/dashboard/home-actions.ts`, `app/dashboard/transactions/actions.ts`): `sendPendingNotificationEmails(userId)` added to `lib/email.ts`; generates all current notifications, emails any not yet recorded, swallows errors silently so delivery never blocks the response; wired into `createBudget`, `updateBudgetLimit`, `payBill`, `paySubscription`, `addFundsToGoalAction`, and `createTransaction` via Next.js `after()`.
- **Worktree cleanup**: merged `alpha` branch (email notifications) into `main` with no conflicts; removed all stale worktrees (`alpha`, `beta`, `gama`, `session-multi-instance`) and their branches.

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. Cash on hand period data is mock-only — `cashFlowDataByPeriod` hardcoded; API returns single array
3. Currency propagation in server components — `app/dashboard/page.tsx` and `app/dashboard/accounts/[id]/page.tsx` still hardcode USD
4. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
5. Subscription pay button not wired in UI — `paySubscription` exists but has no caller
6. Cron email endpoint requires external scheduler (cron-job.org / GitHub Actions) — no built-in scheduler

### Last checks
- pnpm lint: not run
- pnpm build: not run

---

## Session 2026-06-02

### What was built / fixed
- **Cash flow helpers extracted** (`lib/cash-flow.ts`, NEW): `buildDailyBalanceHistory`, `sampleWeekly`, `sampleMonthly`, `computeCashFlow`, and all label/date helpers moved from `app/api/dashboard/route.ts` into a shared module; dashboard route now imports from `@/lib/cash-flow`.
- **Account detail API — period support** (`app/api/accounts/[id]/route.ts`): accepts `?period=1W|1M|3M|1Y` (default `1M`); calls `computeCashFlow` on the account's real transactions to produce `balanceHistoryByPeriod` and `balanceHistoryLabelsByPeriod`; returns all four periods in one response so the client never needs to re-fetch for a different period.
- **Contract — AccountDetail updated** (`contracts/api-contracts.ts`): added `period`, `balanceHistoryByPeriod`, and `balanceHistoryLabelsByPeriod` fields to `AccountDetail`; endpoint comment updated to show `?period` param.
- **Account detail page — client component rewrite** (`app/dashboard/accounts/[id]/AccountDetailClient.tsx`, NEW; `app/dashboard/accounts/[id]/page.tsx` thinned): `page.tsx` is now a thin server wrapper; `AccountDetailClient` is a client component that owns `period` state, fetches `/api/accounts/${id}?period=${period}` on mount and on period change, and uses `balanceHistoryByPeriod[period]` for the chart data and Low/High stats; loading skeleton, error state with retry, and not-found state all implemented.
- **PeriodSelector — onChange callback** (`app/components/ui/PeriodSelector.tsx`): added `onChange?: (period: string) => void` prop; called on every period selection so parent components can react.
- **Mock data updated** (`lib/mock-data.ts`): `MOCK_ACCOUNT_DETAILS` entries now include `period`, `balanceHistoryByPeriod`, and `balanceHistoryLabelsByPeriod` to satisfy the updated `AccountDetail` type.
- **Add Transaction form — dynamic account list** (`app/components/forms/AddTransactionForm.tsx`): replaced hardcoded `ACCOUNTS` constant with a `useEffect` that fetches `GET /api/accounts` on mount; the select is populated from real user accounts (`account.name + ' ' + account.number`); disabled with `aria-busy` while loading.
- **Transactions — immediate list update** (`app/dashboard/transactions/actions.ts`, `AddTransactionButton.tsx`, `AddTransactionForm.tsx`, `page.tsx`): `createTransaction` now returns the full `Transaction` object on success; `AddTransactionForm` accepts `onCreated?: (tx: Transaction) => void` and calls it before closing; `AddTransactionButton` threads the callback through; the transactions page prepends the new transaction to the list with `setTransactions(prev => [tx, ...prev])` — no page reload needed.

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. Currency propagation in server components — `app/dashboard/page.tsx` still hardcodes USD (account page now uses `useCurrency()`)
3. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
4. Subscription pay button not wired in UI — `paySubscription` exists but has no caller
5. Cron email endpoint requires external scheduler (cron-job.org / GitHub Actions) — no built-in scheduler
6. Account `monthlySummary` on the detail page aggregates all-time totals, not scoped to the current calendar month

### Last checks
- pnpm lint: passed (0 errors, 2 pre-existing warnings)
- pnpm build: not run

---

## Session 2026-06-02 (continued — flow completion)

### What was built / fixed

- **Onboarding wizard** (`app/components/onboarding/OnboardingWizard.tsx`, NEW; `app/components/onboarding/OnboardingGate.tsx`, NEW; `app/dashboard/layout.tsx`): 3-step wizard (Welcome → Add Account → Done) appears on first login when `/api/accounts` returns empty; sets `assetly-onboarding-done` cookie on completion or skip; uses existing `.modal-overlay`/`.modal-panel` CSS classes; `AddAccountForm` embedded in step 2; Escape key and Skip close the wizard on steps 2+; body scroll locked while open.
- **Accounts list page** (`app/dashboard/accounts/page.tsx`, NEW; `app/dashboard/accounts/actions.ts`; `lib/data/store.ts`): `/dashboard/accounts` route listing all accounts with color dot, balance, type badge; inline edit panel (name + balance) calls new `updateAccountAction`; delete via `window.confirm` calls new `deleteAccountAction`; Add Account button opens existing `AddAccountForm` modal; loading skeleton, error, and empty states; `updateAccount` and `removeAccount` helpers added to store.
- **Subscription Pay button** (`app/dashboard/bills/page.tsx`): "Pay now" button in each subscription's inline edit panel calls `paySubscription` (already existed in `home-actions.ts`); triggers re-fetch on success; loading + error states.
- **Goal funding → transaction** (`app/dashboard/goals/actions.ts`, `app/dashboard/home-actions.ts`): `addFundsToGoal` and `addFundsToGoalAction` now also call `insertTransaction` with `category: 'Transfers'`, `accountLabel: 'Goal Transfer'`, `merchant: goal.name` so goal contributions appear in the transaction list and count against budgets.
- **Empty states** (`app/dashboard/goals/page.tsx`, `app/dashboard/budgets/page.tsx`, `app/dashboard/transactions/page.tsx`, `app/dashboard/bills/page.tsx`): all pages now have proper empty states (icon + heading + subtext + CTA); transactions has two variants — "no transactions yet" and "no results after filter" (Clear filters button).

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. Currency propagation in server components — `app/dashboard/page.tsx` still hardcodes USD
3. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
4. Cron email endpoint requires external scheduler — no built-in scheduler
5. Account `monthlySummary` on the detail page aggregates all-time totals, not scoped to the current calendar month

### Last checks
- pnpm lint: passed (0 errors, 2 pre-existing warnings)
- pnpm build: not run

---

## Session 2026-06-02 (currency propagation everywhere)

### What was built / fixed
- **`formatCompact` currency param** (`lib/format.ts`): added `currency = "USD"` parameter; replaced hardcoded `$` template literals with `Intl.NumberFormat` so compact values (e.g. `₹1.2k`, `€500`) respect the user-selected currency.
- **CashOnHandCard currency** (`app/components/dashboard/CashOnHandCard.tsx`): added `useCurrency()`; passes currency to the large total, week-delta pill, and chart hover tooltip calls to `formatCompact`.
- **GoalCard (home) currency** (`app/components/dashboard/GoalCard.tsx`): added `useCurrency()`; passes currency to both `formatCompact` calls (current / target).
- **DashboardActivity currency** (`app/components/dashboard/DashboardActivity.tsx`): added `useCurrency()`; passes currency to the "X saved" subtitle `formatCompact` call.
- **Goals page currency** (`app/dashboard/goals/page.tsx`): `GoalCard` inner component already called `useCurrency()` but never passed it to `formatCompact`; now passed to all 5 calls (current, target, to-go inside GoalCard; total saved and total target in the hero strip and header subtitle).
- **Dashboard safe-to-spend currency** (`app/dashboard/page.tsx`): server component now imports `getCurrencyServer` from `@/lib/server-prefs`, reads it alongside the other `Promise.all` fetches, and passes it to all three `formatCurrency` calls in the Safe to spend card (safeToSpend, spentToday, dailyAllowance). Resolves the last known currency-in-server-component limitation.

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` on the detail page aggregates all-time totals, not scoped to the current calendar month

### Last checks
- pnpm lint: passed (0 errors, 2 pre-existing warnings)
- pnpm build: not run

---

## Session 2026-06-02 (cross-account data isolation fix)

### What was built / fixed
- **Dashboard layout data isolation bug** (`app/dashboard/layout.tsx`): `getAccounts()` was called without a `userId` argument; Drizzle drops the WHERE clause when `userId` is `undefined`, returning every account from every user in the database. Fixed by reading the session first, extracting `userId`, then calling `getAccounts(userId)` so the sidebar and topbar only receive the current user's accounts.
- **Stale null-userId seed rows deleted** (database): removed the 3 hardcoded seed accounts (`chase`, `ally`, `broker`) that had `user_id = NULL` — they had no owner and would have surfaced to any user if the isolation guard were ever bypassed again.

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` on the detail page aggregates all-time totals, not scoped to the current calendar month

### Last checks
- pnpm lint: passed (0 errors, 2 pre-existing warnings)
- pnpm build: not run

---

## Session 2026-06-04

### What was built / fixed
- **`clearAllUserData` store helper** (`lib/data/store.ts`): new function deletes all rows in `transactionsTable`, `billsTable`, `subscriptionsTable`, and `goalsTable` scoped to the given `userId`; accounts, budgets, and user profile are left intact.
- **`clearAllData` server action** (`app/dashboard/settings/actions.ts`): reads session, calls `clearAllUserData(userId)`, revalidates `/dashboard` layout, returns `ActionResult`.
- **Settings — Clear all data modal** (`app/dashboard/settings/page.tsx`): added `ClearDataForm` client component with a destructive-action warning box and a "Type CLEAR to confirm" text input; submit button disabled until confirmation matches exactly; calls `clearAllData` on submit; on success closes the modal and re-fetches settings. Added "Clear all data" button in the data section; added `clearDataOpen` state and `<Modal>` wrapper.
- **pnpm-workspace.yaml — `allowBuilds`** (`pnpm-workspace.yaml`): added `allowBuilds` list (`better-sqlite3`, `esbuild`, `sharp`, `unrs-resolver`) to permit native postinstall scripts that pnpm v10 blocks by default.

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` on the detail page aggregates all-time totals, not scoped to the current calendar month

### Last checks
- pnpm lint: not run
- pnpm build: not run

---

## Session 2026-06-04 (readme + git config)

### What was built / fixed
- **README.md rewritten** (`README.md`): updated stack table (added SQLite/Drizzle, NextAuth.js v5, Resend); rewrote features list to reflect all built pages and capabilities; added full routes table; added `.env.local` template with required env vars; added Known Limitations section; removed outdated Insights entry.
- **Git author config fixed**: global git user email on new MacBook was defaulting to `ashishgoyat@Ashishs-MacBook-Air.local`; set to `ashishgoyat.official@gmail.com`; last commit author amended and force-pushed.

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` on the detail page aggregates all-time totals, not scoped to the current calendar month

### Last checks
- pnpm lint: not run
- pnpm build: not run

---

## Session 2026-06-04 (account flow + transactions filter + account detail buttons)

### What was built / fixed

- **Account balance update on transaction** (`lib/data/store.ts`, `app/dashboard/transactions/actions.ts`): added `adjustAccountBalance(id, userId, delta)` and `adjustAccountBalanceByLabel(label, userId, delta)` to store; `createTransaction` now adjusts account balance after every transaction (expense = -amount, income = +amount); revalidates `/dashboard/accounts`.
- **Sidebar account button redesign** (`app/components/layout/Sidebar.tsx`): replaced colored dot + plain text with a 22×22 rounded square icon (first letter in account color), two-line flex-column label (account name + masked number), and balance on the right; collapsed state hides all text, shows only the square icon.
- **Sync button on account detail** (`lib/data/store.ts`, `app/dashboard/accounts/actions.ts`, `app/dashboard/accounts/[id]/AccountDetailClient.tsx`): `syncAccountAction` updates `lastSync` to "Just now" in DB; Sync button shows "Syncing…" with disabled state while request is in flight; on success updates the displayed sync time without a page reload.
- **Settings button on account detail** (`AccountDetailClient.tsx`, `accounts/actions.ts`): opens an inline overlay modal; user can rename the account (calls existing `updateAccountAction`) or delete the account (calls `deleteAccountAction`, redirects to dashboard on success).
- **Transfer money on account detail** (`AccountDetailClient.tsx`, `accounts/actions.ts`): opens modal with From (read-only), To (dropdown of other accounts), Amount; `transferMoneyAction` inserts debit + credit transactions, adjusts both account balances, revalidates.
- **Set up auto-save on account detail** (`AccountDetailClient.tsx`, `accounts/actions.ts`): opens modal explaining the feature; user picks savings goal, amount, frequency; `setupAutoSaveAction` immediately funds the first contribution (updates goal currentInCents/percentageComplete/eta, inserts expense transaction, deducts from account); shows next scheduled date.
- **Export CSV on account detail** (`AccountDetailClient.tsx`): fetches all transactions, filters client-side by accountLabel, downloads as `<AccountName>-transactions-<date>.csv`.
- **Account filter on transactions page** (`app/dashboard/transactions/page.tsx`): added `accountFilter` state; Account section added to the Filter popover below Type/Status; filters by exact `accountLabel` match; `hasActiveFilter` and Clear all reset include account filter.

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` on the detail page aggregates all-time totals, not scoped to the current calendar month
5. Auto-save frequency is not automatically enforced — next trigger is manual (press Sync)

### Last checks
- pnpm lint: passed (0 errors, 2 pre-existing warnings)
- pnpm build: not run

---

## Session 2026-06-04 (Supabase migration)

### What was built / fixed
- **Database migrated from SQLite to Supabase (PostgreSQL)** (`lib/db/schema.ts`, `lib/db/index.ts`, `drizzle.config.ts`, `package.json`): removed `@libsql/client`; added `postgres` npm package; schema migrated from `drizzle-orm/sqlite-core` (`sqliteTable`) to `drizzle-orm/pg-core` (`pgTable`); integer booleans (`integer({ mode: 'boolean' })`) replaced with native PostgreSQL `boolean` columns on `budgets.isOver`, `bills.isAutoPay`, `bills.isUrgent`, `subscriptions.isUsed`, `insights.isPinned`; `lib/db/index.ts` rewritten — SQLite/libSQL client, manual `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE` migrations, and `PRAGMA` checks all removed; replaced with a minimal `postgres` + Drizzle setup (`max: 1` for serverless connection limit); `ensureDb()` retained as a no-op for store.ts call-site compatibility.
- **Drizzle config updated** (`drizzle.config.ts`): dialect changed from `turso` → `postgresql`; reads `DATABASE_URL` from env via `dotenv`; `dotenv` added as devDependency.
- **Migration file generated** (`drizzle/0000_jittery_madelyne_pryor.sql`): full `CREATE TABLE` DDL for all 11 tables in PostgreSQL syntax; ready to apply with `pnpm drizzle-kit migrate`.
- **Notification sort + timestamp fix** (`lib/data/store.ts`): `large_transaction` notifications now use real event time (`parseTxDateTime`) instead of hardcoded midnight-UTC; notification sort changed from type-priority order to unread-first then newest-createdAt-first.
- **Notification refresh event** (`app/components/forms/AddTransactionForm.tsx`): dispatches `assetly:notifications-refresh` after creating a transaction so the topbar bell re-fetches immediately.

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` on the detail page aggregates all-time totals, not scoped to the current calendar month
5. Auto-save frequency is not automatically enforced — next trigger is manual (press Sync)
6. `pnpm drizzle-kit migrate` must be run once manually to push schema to Supabase

### Last checks
- pnpm lint: passed (0 errors, 2 pre-existing warnings)
- pnpm build: not run

---

## Session 2026-06-04 (user feedback — currency, quick add, payment method, responsiveness)

### What was built / fixed

- **Onboarding — currency step added** (`app/components/onboarding/OnboardingWizard.tsx`): wizard is now 4 steps: Welcome → Choose Currency → Add Account → All Set. Step 2 shows 3 selectable currency cards (USD/INR/EUR); on Next, saves choice to `assetly-currency` cookie. ProgressDots updated to 4 dots.
- **Real exchange rate conversion** (`app/contexts/CurrencyContext.tsx`, `lib/format.ts`): `CurrencyProvider` now fetches live rates from `open.er-api.com/v6/latest/USD` on mount; falls back to `{ USD: 1, INR: 84, EUR: 0.92 }` on failure. `formatCurrency`, `formatCurrencyExact`, `formatCompact` each gained an optional `rate = 1` parameter. New `useExchangeRate()` hook exported.
- **Sidebar account balances — currency-aware** (`app/components/layout/Sidebar.tsx`): removed hardcoded `formatBalance`; now calls `useCurrency()` + `useExchangeRate()` and passes both to `formatCurrency`.
- **Quick Add FAB** (`app/components/dashboard/QuickAddFab.tsx` NEW; `app/dashboard/layout.tsx`): fixed bottom-right `+` button; animated menu with 5 options (Transaction, Goal, Bill, Budget, Subscription); each opens the appropriate form in a Modal.
- **Responsive + mobile fixes** (`app/globals.css`, `app/dashboard/transactions/page.tsx`): `.page-content` capped at `max-width: 1400px` for large screens; mobile block with 44px touch targets, bottom-sheet modals, search constrained, tx-detail stacks single-column, padding tightened.
- **Payment method on transactions** (`lib/db/schema.ts`, `lib/data/store.ts`, `app/dashboard/transactions/actions.ts`, `app/components/forms/AddTransactionForm.tsx`, `app/dashboard/transactions/page.tsx`): nullable `payment_method` column; migration `drizzle/0001_add_payment_method.sql`; segmented selector (UPI/Card/Cash/Bank/Other) in AddTransactionForm; detail panel shows and edits payment method.
- **Cash account type** (`app/components/forms/AddAccountForm.tsx`, `contracts/api-contracts.ts`): `AccountType` widened to `'cash'`; AddAccountForm type select includes "Cash (Physical Wallet)".
- **Contract update** (`contracts/api-contracts.ts`): added `PaymentMethod` type, `paymentMethod?: PaymentMethod` to `Transaction`, `'cash'` to `AccountType`.

### Action required (before production)
- Apply `drizzle/0001_add_payment_method.sql` on Supabase: `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;`

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` aggregates all-time totals, not scoped to current calendar month
5. Auto-save frequency not automatically enforced — next trigger is manual (Sync)
6. Exchange rate fetched once on mount — not refreshed if tab stays open for days
7. Quick Add FAB: goal/budget pages don't auto-refresh after FAB creates new item (page reload needed)

### Last checks
- pnpm lint: passed (0 errors, 3 pre-existing warnings)
- pnpm build: not run

---

## Session 2026-06-04 (cash payment UX + charge percent)

### What was built / fixed
- **Edit transaction panel — cash payment** (`app/dashboard/transactions/page.tsx`): removed "Other" from payment options; Account row hidden when paymentMethod is "cash"; switching to cash auto-sets accountLabel to "Cash"
- **Add funds from cash on account detail** (`app/dashboard/accounts/actions.ts`, `app/dashboard/accounts/[id]/AccountDetailClient.tsx`): new "Add funds from cash" button in Quick Actions; modal with Amount + optional Note; `addFundsFromCashAction` inserts income transaction (paymentMethod: cash, category: Income) and adjusts account balance; balance updates optimistically in UI
- **Transaction charge percent** (`contracts/api-contracts.ts`, `lib/db/schema.ts`, `lib/data/store.ts`, `app/dashboard/transactions/actions.ts`, `app/components/forms/AddTransactionForm.tsx`, `app/dashboard/transactions/page.tsx`): optional `chargePercent` field on transactions; `charge_percent REAL` column + migration `drizzle/0002_add_charge_percent.sql`; AddTransactionForm shows Charge/Fee % input with live net preview; account balance adjusted by net amount (gross − charge) for income; detail panel shows and edits charge %, displays net-after-charge

### Action required (before production)
- Apply `drizzle/0002_add_charge_percent.sql` on Supabase: `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS charge_percent REAL;`

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` aggregates all-time totals, not scoped to current calendar month
5. Auto-save frequency not automatically enforced — next trigger is manual (Sync)
6. Exchange rate fetched once on mount — not refreshed if tab stays open for days
7. Quick Add FAB: goal/budget pages don't auto-refresh after FAB creates new item (page reload needed)
8. Charge percent affects income account balance only; expense surcharge (adding charge to debit) not implemented

### Last checks
- pnpm lint: passed (0 errors, 3 pre-existing warnings)
- pnpm build: not run

---

## Session 2026-06-05 (complete UI redesign)

### What was built / fixed
- **Color palette overhaul** (`app/globals.css`): light mode background shifted from warm cream (`#f6f1e7`) to neutral warm gray (`#EFECE7`); accent replaced from terracotta (`#c96442`) to black (`#111111`); dark mode shifted to near-black (`#111111` bg); positive color brightened to `#16A34A` / `#22C55E`; negative to `#DC2626`; new `.card-dark` class added (dark navy `#0F172A` background for hero cards)
- **Typography cleanup** (`app/globals.css`, all dashboard pages): removed Caveat display font from `.page-head .h-title` CSS rule and from all `className="serif"` / `className="serif num"` usages across transactions, bills, budgets, goals, accounts, settings, account-detail — all headings and numbers now use Geist Sans with `fontWeight: 700`
- **Dashboard layout redesign** (`app/dashboard/page.tsx`, `app/components/dashboard/CashOnHandCard.tsx`): net worth/cash-flow card moved to left wide column with `dark` prop (dark navy card, green chart, white text); safe-to-spend moved to right narrow column as clean white card; greeting removes Caveat font; `CashOnHandCard` gained `dark?: boolean` prop that sets card class, label ("Net worth"), chart color (`#22C55E`), and period button styling
- **Sidebar user row** (`app/components/layout/Sidebar.tsx`): added "Free plan" subtitle below user name as a two-line flex column
- **Budget hero card** (`app/dashboard/budgets/page.tsx`): hero summary card changed from `card-accent` to `card-dark`; all inner text/bar colors updated for white-on-dark legibility; heatmap intensity colors updated from terracotta to green scale; legend swatches updated to match; `DonutChart` passed `dark` prop
- **Goals page hero** (`app/dashboard/goals/page.tsx`): old single hero strip replaced with 2-column layout — left white card (SVG donut + total saved + progress bar), right `card-dark` showing auto-saving monthly total and active transfer count
- **Bills page decorative checkmark** (`app/dashboard/bills/page.tsx`): `BillRow` adds an absolutely-positioned decorative green checkmark SVG for `isAutoPay` bills when collapsed
- **DonutChart** (`app/components/charts/DonutChart.tsx`): removed Caveat font from center label; added `dark?: boolean` prop for dark-card usage

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` aggregates all-time totals, not scoped to current calendar month
5. Auto-save frequency not automatically enforced — next trigger is manual (Sync)
6. Exchange rate fetched once on mount — not refreshed if tab stays open for days
7. Quick Add FAB: goal/budget pages don't auto-refresh after FAB creates new item (page reload needed)
8. Charge percent affects income account balance only; expense surcharge not implemented

### Last checks
- pnpm lint: passed (0 errors, 3 pre-existing warnings)
- pnpm build: not run

---

## Session 2026-06-05 (currency inputs, duplicate prevention, budget disambiguation)

### What was built / fixed
- **Budget page layout fix** (`app/dashboard/budgets/page.tsx`): budget category cards moved into the left column below the hero card (stacked vertically), eliminating the empty space gap; calendar occupies right column full height
- **getCurrencySymbol helper** (`lib/format.ts`): new exported function returning `$`/`₹`/`€` for USD/INR/EUR
- **Currency-aware amount inputs** (`app/components/forms/AddTransactionForm.tsx`, `app/components/forms/NewGoalForm.tsx`, `app/dashboard/budgets/NewBudgetButton.tsx`, `app/dashboard/budgets/page.tsx` BudgetCard, `app/dashboard/goals/page.tsx` GoalCard): all hardcoded `$` symbols replaced with dynamic currency symbol from `useCurrency()` + `getCurrencySymbol()`
- **Server-side exchange rate conversion** (`app/dashboard/budgets/actions.ts`, `app/dashboard/goals/actions.ts`, `app/dashboard/transactions/actions.ts`): `createBudget`, `createGoal`, `addFundsToGoal`, `updateGoalMonthly`, and `createTransaction` now read currency + exchange rate from cookies via `getCurrencyServer()`/`getExchangeRateServer()` and divide the user's local-currency input by rate before storing
- **Duplicate budget prevention** (`app/dashboard/budgets/actions.ts`): `createBudget` blocks a second budget with the same name + category
- **Duplicate goal prevention** (`app/dashboard/goals/actions.ts`): `createGoal` blocks a second goal with the same name
- **Budget disambiguation** (`lib/db/schema.ts`, `lib/data/store.ts`, `contracts/api-contracts.ts`, `app/api/budgets/route.ts`, `app/dashboard/transactions/actions.ts`, `app/components/forms/AddTransactionForm.tsx`, `drizzle/0003_add_budget_id.sql`): added nullable `budget_id TEXT` column; "Which budget?" picker appears in the Add Transaction form when a category has 2+ budgets; tagged transactions count only toward their specified budget; untagged transactions fall back to category matching

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` aggregates all-time totals, not scoped to current calendar month
5. Auto-save frequency not automatically enforced — next trigger is manual (Sync)
6. Exchange rate fetched once on mount — not refreshed if tab stays open for days
7. Quick Add FAB: goal/budget pages don't auto-refresh after FAB creates new item (page reload needed)
8. Charge percent affects income account balance only; expense surcharge not implemented

### Last checks
- pnpm lint: passed (0 errors, 3 pre-existing warnings)
- pnpm build: not run

---

## Session 2026-06-05b (settings cleanup + session instances)

### What was built / fixed
- **Settings decorative SVG removed** (`app/dashboard/settings/page.tsx`): removed `SettingsIllustration` fixed-position decorative component from the bottom-right corner of the settings page; removed now-unused import, `resolvedTheme`, `mounted`, `useTheme`, and `useSyncExternalStore`
- **Hamburger button CSS fix** (`app/globals.css`): `.btn-icon { display: inline-flex }` (line 620) was overriding `.hamburger { display: none }` (line 354) due to CSS ordering — fixed with `!important` on the hamburger rules so it is correctly hidden on desktop
- **Budget layout fix** (`app/dashboard/budgets/page.tsx`): budget category cards moved into the left column below the hero, stacked vertically — eliminates empty gap on the left side
- **Active sessions list in Settings** (`app/dashboard/settings/page.tsx`, `app/api/settings/route.ts`, `app/api/sessions/route.ts`, `app/dashboard/settings/actions.ts`): Security section now lists each active session showing browser/OS device name, sign-in date, expiry countdown, "Current" badge on newest session, and a Revoke button per session (current session revoke is disabled)
- **Device info + IP captured on sign-in** (`auth.ts`, `lib/data/store.ts`, `lib/db/schema.ts`): `insertUserSession` now accepts optional `deviceInfo` (parsed from user-agent) and `ipAddress` (from x-forwarded-for); new nullable columns `device_info` and `ip_address` added to `user_sessions` table
- **Migration 0004** (`drizzle/0004_add_session_device_info.sql`): adds `device_info TEXT` and `ip_address TEXT` nullable columns to `user_sessions`; applied to Supabase
- **Type fix** (`app/api/settings/route.ts`): DB returns `string | null` for nullable session columns; mapped to conditional spreads so `null` becomes absent (`undefined`) matching `SessionInstance` type contract

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` aggregates all-time totals, not scoped to current calendar month
5. Auto-save frequency not automatically enforced — next trigger is manual (Sync)
6. Exchange rate fetched once on mount — not refreshed if tab stays open for days
7. Quick Add FAB: goal/budget pages don't auto-refresh after FAB creates new item (page reload needed)
8. Charge percent affects income account balance only; expense surcharge not implemented
9. Session revoke via `deleteUserSession` removes the DB row but does not invalidate the JWT — full sign-out requires "Sign out all devices" which increments `sessionVersion`

### Last checks
- pnpm lint: passed (0 errors, 3 pre-existing warnings)
- pnpm build: failed before type fix; passes after fix

---

## Session 2026-06-05 (login page redesign)

### What was built / fixed
- **Auth layout logo fix** (`app/(auth)/layout.tsx`): "A" lettermark box used `text-white` Tailwind class; in dark mode `var(--ink)` (box background) becomes white, making the "A" invisible. Fixed by removing `text-white` and setting `color: var(--bg)` so the letter always contrasts against its background.
- **Login button fix** (`app/(auth)/login/page.tsx`): Google sign-in button used `background: var(--accent)` + `color: 'white'`; in dark mode `--accent` is white, making the text invisible. Fixed by using `background: var(--surface-2)` + `color: var(--ink)` + a border.
- **Login page recreation** (`app/(auth)/login/page.tsx`): Added feature list (3 bullets with green check icons), normal-height button (`py-3` vs old `py-10`), divider, and privacy note. Card narrowed to `max-w-sm`. Footer Terms/Privacy line added to layout.

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` aggregates all-time totals, not scoped to current calendar month
5. Auto-save frequency not automatically enforced — next trigger is manual (Sync)
6. Exchange rate fetched once on mount — not refreshed if tab stays open for days
7. Quick Add FAB: goal/budget pages don't auto-refresh after FAB creates new item (page reload needed)
8. Charge percent affects income account balance only; expense surcharge not implemented
9. Session revoke via `deleteUserSession` removes the DB row but does not invalidate the JWT — full sign-out requires "Sign out all devices" which increments `sessionVersion`

### Last checks
- pnpm lint: passed (0 errors, 3 pre-existing warnings)
- pnpm build: not run

---

## Session 2026-06-05 (field-level encryption for financial data)

### What was built / fixed
- **`lib/crypto.ts`** (NEW): AES-256-GCM encrypt/decrypt utility using Node.js built-in `crypto` module only. `encrypt(plaintext)` generates a fresh 12-byte IV per call, returns `iv:authTag:ciphertext` (colon-delimited base64). `decrypt(ciphertext)` returns `null` on any failure (auth tag mismatch, malformed input, plaintext values not yet migrated). `ENCRYPTION_KEY` env var must be a base64-encoded 32-byte string.
- **`lib/data/store.ts`** (8 changes): encrypt on write, decrypt on read for four sensitive display-only fields — `transactions.note`, `accounts.number`, `accounts.routingNumber`, `user_sessions.ipAddress`. `adjustAccountBalanceByLabel` raw query also patched to decrypt `r.number` before string-matching against `accountLabel`.
- **`scripts/encrypt-existing-data.ts`** (NEW): idempotent one-time migration script; reads existing rows, detects plaintext via `decrypt() === null`, encrypts and writes back in batches of 100. Run with `pnpm encrypt-db`.
- **`.env.example`** (NEW): template listing all required env vars with placeholder values; includes generation command for `ENCRYPTION_KEY`.
- **`.env.local`**: `ENCRYPTION_KEY` added.
- **`package.json`**: `"encrypt-db"` script added.

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` aggregates all-time totals, not scoped to current calendar month
5. Auto-save frequency not automatically enforced — next trigger is manual (Sync)
6. Exchange rate fetched once on mount — not refreshed if tab stays open for days
7. Quick Add FAB: goal/budget pages don't auto-refresh after FAB creates new item (page reload needed)
8. Charge percent affects income account balance only; expense surcharge not implemented
9. Session revoke via `deleteUserSession` removes the DB row but does not invalidate the JWT — full sign-out requires "Sign out all devices"
10. **Existing DB rows are still plaintext** — run `pnpm encrypt-db` once to migrate them

### Last checks
- pnpm lint: passed (0 errors, 3 pre-existing warnings)
- pnpm build: not run

---

## Session 2026-06-05 (responsive overhaul + UI bug fixes)

### What was built / fixed

**Responsive design overhaul (RESPONSIVE.md rules applied):**
- `app/layout.tsx` — added typed `Viewport` export (`width: device-width`, `initialScale: 1`, `themeColor` for light/dark)
- `app/globals.css` — `overflow-x: hidden` on body; global `font-size: 16px` reset on all inputs/textareas/selects (prevents iOS auto-zoom); `.search input` 13px → 16px; `.field-input` 14px → 16px; `.page-head .h-title` fixed 36px → `clamp(1.5rem, 3.5vw, 2.25rem)`; `.btn-icon` gets `min-width/min-height: 44px` on mobile; `.tx-row > :nth-child(2)` gets `min-width: 0`; popover `max-width: calc(100vw - 2rem)` on mobile; toggle thumb fix (see below)
- All page `<h1>` headings converted from fixed `40px` → `clamp(1.5rem, 4vw, 2.5rem)`
- Dashboard greeting and safe-to-spend number use `clamp()` fluid sizes
- Layout grids on `dashboard/page.tsx`, `budgets/page.tsx`, `goals/page.tsx`, `accounts/[id]/AccountDetailClient.tsx` switched from inline `gridTemplateColumns` to shared CSS grid classes (collapse to 1-col on mobile)
- Budget heatmap calendar wrapped in `.table-scroll` div for horizontal scroll on mobile
- Bills/subscriptions edit form grids use `auto-fit minmax(160px, 1fr)` to auto-collapse
- Settings profile/form grids use `auto-fit minmax(180px, 1fr)`; danger-zone button row gets `flexWrap: wrap`
- Transaction detail panel uses `min(360px, 100%)` column width
- All inline edit/detail panel selects and inputs upgraded to `font-size: 16`
- Login Google button gets `min-h-[44px]`; notification panel capped at `min(320px, calc(100vw - 2rem))`; sidebar user name span gets `minWidth: 0`; QuickAddFab bottom uses `clamp(24px, 5vh, 80px)`; account detail header wraps on mobile

**UI bug fixes:**
- `CashOnHandCard.tsx` — removed "X this week" delta pill from the net worth card header; made `weekDeltaInCents` prop optional; removed now-unused `Icon` import
- `DonutChart.tsx` — fixed `strokeDashoffset` bug: offset was `circumference - prevAcc`, missing the segment's own `len`, causing every segment to render shifted forward by its own length. Corrected to `circumference + clampedLen - prevAcc`; pre-clamp `len` in `computedSegs` so `strokeDasharray` no longer needs a second `Math.max`
- `globals.css` — toggle thumb dark-mode fix: `.toggle input:checked ~ .toggle-thumb` now sets `background: var(--bg)`, making the thumb visible when the (white in dark mode) track is active
- `accounts/page.tsx` — Edit button in `AccountCard` action row now hidden with `{!editing && ...}` when the card is already in edit mode
- `NewGoalForm.tsx` — selected icon button `color: "white"` → `color: "var(--bg)"` so icon is visible in dark mode (where `--accent` background is white)

**Lint warning cleanup:**
- `app/api/dashboard/route.ts` — removed unused `day` from `parseDate` destructure
- `app/dashboard/bills/page.tsx` — removed unused `unusedSubs` variable
- `app/dashboard/error.tsx` — removed unused `error` from props destructure

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` aggregates all-time totals, not scoped to current calendar month
5. Auto-save frequency not automatically enforced — next trigger is manual (Sync)
6. Exchange rate fetched once on mount — not refreshed if tab stays open for days
7. Quick Add FAB: goal/budget pages don't auto-refresh after FAB creates new item (page reload needed)
8. Charge percent affects income account balance only; expense surcharge not implemented
9. Session revoke via `deleteUserSession` removes the DB row but does not invalidate the JWT — full sign-out requires "Sign out all devices"
10. **Existing DB rows are still plaintext** — run `pnpm encrypt-db` once to migrate them

### Last checks
- pnpm lint: passed (0 errors, 0 warnings)
- pnpm build: not run

---

## Session 2026-06-05 (mobile drawer portal fix)

### What was built / fixed
- **`app/globals.css`** — moved `overflow-x: hidden` from the `html, body` combined selector to `html` only; `overflow: hidden` on `body` creates a scroll container on iOS Safari that breaks `position: fixed` children (the drawer overlay and panel were not appearing on mobile)
- **`app/components/layout/MobileDrawer.tsx`** — wrapped return in `createPortal(…, document.body)` so the overlay and nav render at the top level of the DOM, outside any overflow container; removed the `useState`/`useEffect` mounted guard that triggered the project's `react-hooks/set-state-in-effect` lint rule (not needed since the component only ever renders after a user click, never during SSR)

### Known limitations / pending
1. Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
2. `paySubscription` advances `nextDate` by a flat 30 days — not calendar-month accurate
3. Cron email endpoint requires external scheduler — no built-in scheduler
4. Account `monthlySummary` aggregates all-time totals, not scoped to current calendar month
5. Auto-save frequency not automatically enforced — next trigger is manual (Sync)
6. Exchange rate fetched once on mount — not refreshed if tab stays open for days
7. Quick Add FAB: goal/budget pages don't auto-refresh after FAB creates new item (page reload needed)
8. Charge percent affects income account balance only; expense surcharge not implemented
9. Session revoke via `deleteUserSession` removes the DB row but does not invalidate the JWT — full sign-out requires "Sign out all devices"
10. **Existing DB rows are still plaintext** — run `pnpm encrypt-db` once to migrate them

### Last checks
- pnpm lint: passed (0 errors, 0 warnings)
- pnpm build: not run
