# Assetly

Personal finance dashboard for tracking net worth, transactions, budgets, and goals — with real-time data, dark mode, and Google sign-in.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| Database | SQLite (`assetly.db`) + Drizzle ORM + `@libsql/client` |
| Auth | NextAuth.js v5 (Google OAuth) |
| Validation | Zod v4 |
| Email | Resend |
| Package manager | pnpm |

## Features

- **Dashboard** — safe-to-spend card, dynamic cash-on-hand chart (1W/1M/3M/1Y), upcoming bills, recent activity, saving goals
- **Transactions** — paginated list with search, category/type/status filters, month picker, CSV export, inline edit and delete
- **Budgets** — real transaction aggregation per category, month picker, per-card inline edit/delete, spending heatmap
- **Goals** — progress cards with add funds, adjust monthly, and delete; goal contributions create transactions
- **Bills** — period-filtered timeline (30d/60d/90d), inline edit/delete; subscriptions grid with Pay now
- **Accounts** — list page with inline edit/delete; per-account detail with period-switching balance chart
- **Settings** — edit profile, currency (USD/INR/EUR), timezone, notification preferences, export data, clear all data, delete account
- **Notifications** — dynamic bell with real DB-derived alerts (bill due, budget exceeded, large tx, goal milestone); email delivery via Resend
- **Onboarding** — 3-step wizard on first login (Welcome → Add Account → Done)
- Dark mode (class-based via next-themes, crossfade transition), mobile responsive, motion system with reduced-motion support

## Routes

```
/                          Public landing page
/login                     Google OAuth sign-in
/dashboard                 Home: safe-to-spend, chart, bills, activity, goals
/dashboard/transactions    List with search, filters, detail panel
/dashboard/budgets         Donut + heatmap + budget cards
/dashboard/goals           Progress cards
/dashboard/bills           Timeline + subscriptions
/dashboard/accounts        Account list
/dashboard/accounts/[id]   Per-account detail with balance chart
/dashboard/settings        Profile · Appearance · Notifications · Data
```

## Getting Started

```bash
pnpm install
```

Create a `.env.local` file:

```env
AUTH_SECRET=<random string>
AUTH_GOOGLE_ID=<your Google OAuth client ID>
AUTH_GOOGLE_SECRET=<your Google OAuth client secret>
RESEND_API_KEY=<your Resend API key>        # optional — email notifications
CRON_SECRET=<random string>                 # optional — email cron endpoint
```

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

## Commands

```bash
pnpm dev       # development server
pnpm build     # production build
pnpm lint      # ESLint
```

## Known Limitations

- Seed transactions only cover April 17–23, 2026 — budget aggregation reads $0 outside that window
- `paySubscription` advances next date by a flat 30 days, not a calendar month
- Email cron endpoint (`/api/cron/notifications`) requires an external scheduler (cron-job.org / GitHub Actions)
- Account monthly summary aggregates all-time totals, not scoped to the current calendar month
