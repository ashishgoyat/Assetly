# Assetly

Personal finance dashboard for tracking net worth, transactions, budgets, and goals.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| Validation | Zod v4 |
| Package manager | pnpm |

## Features

- **Dashboard** — net worth summary, spending area chart, category donut, recent transactions
- **Transactions** — paginated list with category filter and detail panel
- **Budgets** — monthly budget bars, donut chart, spending heatmap
- **Goals** — savings goal progress with ETA
- **Bills** — upcoming bills timeline and subscriptions grid
- **Insights** — AI-style spending insights
- **Accounts** — per-account detail view
- Dark mode, mobile responsive, form modals for adding transactions, goals, and bills

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
pnpm dev    # development server
pnpm build  # production build
pnpm lint   # ESLint
```
