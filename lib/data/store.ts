/**
 * In-memory data store with seed data.
 * All monetary values are in cents (smallest USD unit).
 * Replace with DB queries when a real database is introduced.
 */

import type {
  Transaction,
  Account,
  Budget,
  Goal,
  Bill,
  Subscription,
  Insight,
} from '@/contracts/api-contracts'

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export const transactions: Transaction[] = [
  // --- from home.jsx DATA.recent ---
  {
    id: 'tx-001',
    date: '2026-04-23',
    time: '11:42 AM',
    merchant: "Trader Joe's",
    category: 'Groceries',
    accountLabel: 'Chase ··4521',
    amountInCents: 4820, // $48.20
    type: 'expense',
    status: 'posted',
  },
  {
    id: 'tx-002',
    date: '2026-04-23',
    time: '9:14 AM',
    merchant: 'Spotify',
    category: 'Subscriptions',
    accountLabel: 'Chase ··4521',
    amountInCents: 1099, // $10.99
    type: 'expense',
    status: 'posted',
  },
  {
    id: 'tx-003',
    date: '2026-04-22',
    time: '5:30 PM',
    merchant: 'Paycheck',
    category: 'Income',
    accountLabel: 'Ally Checking',
    amountInCents: 218000, // $2,180.00
    type: 'income',
    status: 'posted',
  },
  {
    id: 'tx-004',
    date: '2026-04-22',
    time: '2:18 PM',
    merchant: 'Uber',
    category: 'Transport',
    accountLabel: 'Chase ··4521',
    amountInCents: 1450, // $14.50
    type: 'expense',
    status: 'posted',
  },
  {
    id: 'tx-005',
    date: '2026-04-22',
    time: '9:02 AM',
    merchant: 'Coffee Bar',
    category: 'Dining',
    accountLabel: 'Chase ··4521',
    amountInCents: 640, // $6.40
    type: 'expense',
    status: 'posted',
  },
  {
    id: 'tx-006',
    date: '2026-04-21',
    time: '3:44 PM',
    merchant: 'Amazon',
    category: 'Shopping',
    accountLabel: 'Chase ··4521',
    amountInCents: 3218, // $32.18
    type: 'expense',
    status: 'posted',
  },
  {
    id: 'tx-007',
    date: '2026-04-21',
    time: '11:08 AM',
    merchant: 'Whole Foods',
    category: 'Groceries',
    accountLabel: 'Chase ··4521',
    amountInCents: 2875, // $28.75
    type: 'expense',
    status: 'posted',
  },
  // --- from pages1.jsx allTx extras ---
  {
    id: 'tx-008',
    date: '2026-04-20',
    time: '8:14 PM',
    merchant: 'Venmo · Sam',
    category: 'Transfers',
    accountLabel: 'Ally Checking',
    amountInCents: 4500, // $45.00
    type: 'expense',
    status: 'posted',
  },
  {
    id: 'tx-009',
    date: '2026-04-20',
    time: '7:02 PM',
    merchant: 'AMC Theaters',
    category: 'Entertainment',
    accountLabel: 'Chase ··4521',
    amountInCents: 2240, // $22.40
    type: 'expense',
    status: 'posted',
  },
  {
    id: 'tx-010',
    date: '2026-04-19',
    time: '6:45 PM',
    merchant: 'Lyft',
    category: 'Transport',
    accountLabel: 'Chase ··4521',
    amountInCents: 920, // $9.20
    type: 'expense',
    status: 'posted',
  },
  {
    id: 'tx-011',
    date: '2026-04-19',
    time: '5:12 PM',
    merchant: "Trader Joe's",
    category: 'Groceries',
    accountLabel: 'Chase ··4521',
    amountInCents: 5230, // $52.30
    type: 'expense',
    status: 'posted',
  },
  {
    id: 'tx-012',
    date: '2026-04-18',
    time: '12:00 AM',
    merchant: 'Interest',
    category: 'Income',
    accountLabel: 'Ally Savings',
    amountInCents: 412, // $4.12
    type: 'income',
    status: 'posted',
  },
  {
    id: 'tx-013',
    date: '2026-04-17',
    time: '9:00 AM',
    merchant: 'Verizon',
    category: 'Bills',
    accountLabel: 'Chase ··4521',
    amountInCents: 6000, // $60.00
    type: 'expense',
    status: 'posted',
  },
]

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export const accounts: Account[] = [
  {
    id: 'chase',
    name: 'Chase Checking',
    number: '··4521',
    balanceInCents: 324718, // $3,247.18
    weekDeltaInCents: 21400, // $214.00
    type: 'checking',
    color: 'var(--cat-6)',
    routingNumber: '021000021',
    linkedSince: 'Feb 2025',
    lastSync: '2 min ago',
    balanceHistory: [2810, 2850, 2900, 2950, 2920, 3000, 3050, 3100, 3080, 3150, 3200, 3180, 3250, 3300, 3280, 3247].map(
      (v) => v * 100,
    ), // 16 data points in cents
  },
  {
    id: 'ally',
    name: 'Ally Savings',
    number: '··8801',
    balanceInCents: 517340, // $5,173.40
    weekDeltaInCents: 8000, // $80.00
    type: 'savings',
    color: 'var(--cat-2)',
    apyBps: 425, // 4.25%
    routingNumber: '124003116',
    linkedSince: 'Feb 2025',
    lastSync: '2 min ago',
    balanceHistory: [4800, 4850, 4900, 4950, 5000, 5020, 5050, 5080, 5100, 5120, 5140, 5150, 5160, 5165, 5170, 5173].map(
      (v) => v * 100,
    ),
  },
  {
    id: 'broker',
    name: 'Brokerage',
    number: '··2204',
    balanceInCents: 1421000, // $14,210.00
    weekDeltaInCents: 24000, // $240.00
    type: 'investment',
    color: 'var(--cat-4)',
    linkedSince: 'Mar 2025',
    lastSync: '2 min ago',
    balanceHistory: [13000, 13100, 13200, 13150, 13300, 13400, 13350, 13500, 13600, 13700, 13650, 13800, 13900, 14000, 14100, 14210].map(
      (v) => v * 100,
    ),
  },
]

// ---------------------------------------------------------------------------
// Budgets (spentInCents is derived from transactions but pre-loaded for seed)
// ---------------------------------------------------------------------------

export const budgets: Budget[] = [
  {
    id: 'budget-groceries',
    name: 'Groceries',
    category: 'Groceries',
    limitInCents: 35000, // $350
    spentInCents: 28000, // $280
    percentageUsed: 80, // Math.round(280/350*100)
    icon: 'cart',
    color: 'var(--cat-2)',
    isOver: false,
  },
  {
    id: 'budget-dining',
    name: 'Dining out',
    category: 'Dining',
    limitInCents: 20000, // $200
    spentInCents: 22000, // $220 — over budget
    percentageUsed: 110, // Math.round(220/200*100)
    icon: 'coffee',
    color: 'var(--cat-3)',
    isOver: true,
  },
  {
    id: 'budget-transport',
    name: 'Transport',
    category: 'Transport',
    limitInCents: 18000, // $180
    spentInCents: 14000, // $140
    percentageUsed: 78, // Math.round(140/180*100)
    icon: 'car',
    color: 'var(--cat-4)',
    isOver: false,
  },
  {
    id: 'budget-shopping',
    name: 'Shopping',
    category: 'Shopping',
    limitInCents: 20000, // $200
    spentInCents: 8700, // $87
    percentageUsed: 44, // Math.round(87/200*100)
    icon: 'bag',
    color: 'var(--cat-5)',
    isOver: false,
  },
  {
    id: 'budget-entertainment',
    name: 'Entertainment',
    category: 'Entertainment',
    limitInCents: 10000, // $100
    spentInCents: 6500, // $65
    percentageUsed: 65, // Math.round(65/100*100)
    icon: 'play',
    color: 'var(--cat-6)',
    isOver: false,
  },
  {
    id: 'budget-subscriptions',
    name: 'Subscriptions',
    category: 'Subscriptions',
    limitInCents: 5000, // $50
    spentInCents: 4400, // $44
    percentageUsed: 88, // Math.round(44/50*100)
    icon: 'music',
    color: 'var(--cat-1)',
    isOver: false,
  },
]

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export const goals: Goal[] = [
  {
    id: 'goal-emergency',
    name: 'Emergency fund',
    currentInCents: 340000, // $3,400
    targetInCents: 500000, // $5,000
    monthlyContributionInCents: 20000, // $200
    percentageComplete: 68, // Math.round(3400/5000*100)
    eta: 'Aug 2026',
    icon: 'lock',
    color: 'var(--cat-1)',
    vibe: 'Safety net',
  },
  {
    id: 'goal-lisbon',
    name: 'Trip to Lisbon',
    currentInCents: 62000, // $620
    targetInCents: 200000, // $2,000
    monthlyContributionInCents: 17500, // $175
    percentageComplete: 31, // Math.round(620/2000*100)
    eta: 'Oct 2026',
    icon: 'flag',
    color: 'var(--cat-2)',
    vibe: '8-day adventure',
  },
  {
    id: 'goal-laptop',
    name: 'New laptop',
    currentInCents: 110000, // $1,100
    targetInCents: 180000, // $1,800
    monthlyContributionInCents: 25000, // $250
    percentageComplete: 61, // Math.round(1100/1800*100)
    eta: 'Jul 2026',
    icon: 'card',
    color: 'var(--cat-4)',
    vibe: 'Work upgrade',
  },
  {
    id: 'goal-wedding',
    name: 'Wedding gift',
    currentInCents: 20000, // $200
    targetInCents: 50000, // $500
    monthlyContributionInCents: 15000, // $150
    percentageComplete: 40, // Math.round(200/500*100)
    eta: 'Jun 2026',
    icon: 'heart',
    color: 'var(--cat-3)',
    vibe: 'Sara & Tom',
  },
]

// ---------------------------------------------------------------------------
// Bills
// ---------------------------------------------------------------------------

export const bills: Bill[] = [
  {
    id: 'bill-rent',
    name: 'Rent',
    amountInCents: 140000, // $1,400
    dueDate: 'Apr 30',
    dueInDays: 2,
    isAutoPay: true,
    isUrgent: true, // dueInDays <= 3
    category: 'Housing',
    icon: 'home',
    color: 'var(--cat-1)',
  },
  {
    id: 'bill-internet',
    name: 'Internet · Verizon',
    amountInCents: 6000, // $60
    dueDate: 'May 3',
    dueInDays: 10,
    isAutoPay: true,
    isUrgent: false,
    category: 'Utilities',
    icon: 'bill',
    color: 'var(--cat-6)',
  },
  {
    id: 'bill-credit-card',
    name: 'Credit card · Chase',
    amountInCents: 24500, // $245
    dueDate: 'May 8',
    dueInDays: 15,
    isAutoPay: false,
    isUrgent: false,
    category: 'Card payment',
    icon: 'card',
    color: 'var(--cat-4)',
  },
  {
    id: 'bill-gym',
    name: 'Gym',
    amountInCents: 2900, // $29
    dueDate: 'May 12',
    dueInDays: 19,
    isAutoPay: true,
    isUrgent: false,
    category: 'Fitness',
    icon: 'spark',
    color: 'var(--cat-2)',
  },
  {
    id: 'bill-phone',
    name: 'Phone · T-Mobile',
    amountInCents: 7500, // $75
    dueDate: 'May 15',
    dueInDays: 22,
    isAutoPay: true,
    isUrgent: false,
    category: 'Utilities',
    icon: 'bill',
    color: 'var(--cat-6)',
  },
  {
    id: 'bill-electricity',
    name: 'Electricity',
    amountInCents: 8400, // $84
    dueDate: 'May 18',
    dueInDays: 25,
    isAutoPay: false,
    isUrgent: false,
    category: 'Utilities',
    icon: 'bill',
    color: 'var(--cat-3)',
  },
]

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export const subscriptions: Subscription[] = [
  {
    id: 'sub-spotify',
    name: 'Spotify',
    amountMonthlyInCents: 1099, // $10.99
    nextDate: 'May 5',
    isUsed: true,
    icon: 'music',
    color: '#1db954',
  },
  {
    id: 'sub-netflix',
    name: 'Netflix',
    amountMonthlyInCents: 1599, // $15.99
    nextDate: 'May 12',
    isUsed: true,
    icon: 'play',
    color: '#c44545',
  },
  {
    id: 'sub-nyt',
    name: 'NYT',
    amountMonthlyInCents: 400, // $4.00
    nextDate: 'May 2',
    isUsed: true,
    icon: 'list',
    color: '#1c1a16',
  },
  {
    id: 'sub-icloud',
    name: 'iCloud',
    amountMonthlyInCents: 299, // $2.99
    nextDate: 'May 14',
    isUsed: false,
    icon: 'lock',
    color: '#5a8a96',
  },
  {
    id: 'sub-figma',
    name: 'Figma',
    amountMonthlyInCents: 1500, // $15.00
    nextDate: 'May 22',
    isUsed: false,
    icon: 'spark',
    color: '#a259ff',
  },
]

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

export const insights: Insight[] = [
  // Pinned insight
  {
    id: 'insight-pinned',
    glyph: 'sparkle',
    tag: 'Big news',
    tone: 'pos',
    title: "You're saving 23% of income — up 5 points from March",
    body: "If you keep this rate, you'll hit your $5,000 emergency fund 2 months early.",
    cta: 'See breakdown',
    isPinned: true,
    sparklineData: [12, 14, 15, 16, 17, 18, 20, 22, 23],
  },
  // Regular insights
  {
    id: 'insight-001',
    glyph: 'trend',
    tag: 'Spotted',
    tone: 'pos',
    title: 'Coffee spend down 24%',
    body: 'You spent $38 less on coffee than your 3-month average. Want to move it to a goal?',
    cta: 'Move $38 to Lisbon',
    isPinned: false,
  },
  {
    id: 'insight-002',
    glyph: 'bill',
    tag: 'Heads up',
    tone: 'warn',
    title: 'Dining hits limit in 4 days',
    body: "At current pace, you'll hit your $200 dining budget on Apr 27 — 3 days early.",
    cta: 'See breakdown',
    isPinned: false,
  },
  {
    id: 'insight-003',
    glyph: 'cal',
    tag: 'Habit',
    tone: 'neutral',
    title: 'Friday is your spendiest day',
    body: 'You spend 2.3× more on Fridays than weekdays — mostly dining out.',
    cta: 'See pattern',
    isPinned: false,
  },
  {
    id: 'insight-004',
    glyph: 'card',
    tag: 'Found',
    tone: 'warn',
    title: '3 forgotten subscriptions',
    body: "Figma, NYT, and iCloud haven't been opened in 30+ days. $22.99/mo total.",
    cta: 'Review',
    isPinned: false,
  },
  {
    id: 'insight-005',
    glyph: 'goal',
    tag: 'Win',
    tone: 'pos',
    title: 'Streak — 12 days under budget',
    body: "You've stayed under your daily allowance for 12 days straight. Keep it up.",
    cta: 'See streak',
    isPinned: false,
  },
  {
    id: 'insight-006',
    glyph: 'pie',
    tag: 'Compare',
    tone: 'neutral',
    title: 'You vs peers (25-34)',
    body: 'You spend less on dining (−30%) but more on subscriptions (+18%) than peers.',
    cta: 'Full comparison',
    isPinned: false,
  },
]

// ---------------------------------------------------------------------------
// Cash flow data (30 daily data points in cents for area chart)
// Source values: [12,14,13,...38] × 100 cents = relative chart units
// ---------------------------------------------------------------------------

export const cashFlowData: number[] = [
  12, 14, 13, 15, 14, 17, 16, 19, 18, 22,
  20, 24, 22, 26, 25, 28, 27, 30, 29, 32,
  31, 33, 32, 35, 34, 36, 35, 37, 36, 38,
].map((v) => v * 100)

// ---------------------------------------------------------------------------
// Data accessor functions (async-ready for future DB replacement)
// ---------------------------------------------------------------------------

export async function getTransactions(): Promise<Transaction[]> {
  return transactions
}

export async function getAccounts(): Promise<Account[]> {
  return accounts
}

export async function getBudgets(): Promise<Budget[]> {
  return budgets
}

export async function getGoals(): Promise<Goal[]> {
  return goals
}

export async function getBills(): Promise<Bill[]> {
  return bills
}

export async function getSubscriptions(): Promise<Subscription[]> {
  return subscriptions
}

export async function getInsights(): Promise<Insight[]> {
  return insights
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  return accounts.find((a) => a.id === id)
}
