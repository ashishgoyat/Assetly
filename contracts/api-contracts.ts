/**
 * Assetly API Contracts
 * Source of truth for all data shapes shared between frontend and backend.
 * All monetary values are in cents (smallest USD unit). Never do math on formatted strings.
 */

// ---------------------------------------------------------------------------
// Response envelope
// ---------------------------------------------------------------------------

export type ApiSuccess<T> = { data: T; error: null }
export type ApiError = { data: null; error: { message: string; code: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// ---------------------------------------------------------------------------
// Domain enums
// ---------------------------------------------------------------------------

export type TransactionType = 'income' | 'expense'

export type TransactionCategory =
  | 'Groceries'
  | 'Dining'
  | 'Transport'
  | 'Shopping'
  | 'Entertainment'
  | 'Subscriptions'
  | 'Bills'
  | 'Transfers'
  | 'Income'
  | 'Utilities'
  | 'Housing'
  | 'Fitness'
  | 'Other'

export type AccountType = 'checking' | 'savings' | 'investment' | 'cash'

export type PaymentMethod = 'upi' | 'card' | 'cash' | 'bank_transfer' | 'net_banking' | 'other'

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export interface Transaction {
  id: string
  date: string              // ISO date "2026-04-23"
  time: string              // "11:42 AM"
  merchant: string
  category: TransactionCategory
  accountLabel: string      // Display label e.g. "Chase ··4521"
  amountInCents: number     // Always positive integer. Direction from type field.
  type: TransactionType
  status: 'posted' | 'pending'
  note?: string
  paymentMethod?: PaymentMethod
  chargePercent?: number        // Optional fee/commission %, e.g. 11.5 means 11.5%
}

export interface Account {
  id: string
  name: string
  number: string            // Masked e.g. "··4521"
  balanceInCents: number
  weekDeltaInCents: number  // Balance change this week (positive = up)
  type: AccountType
  color: string             // CSS color e.g. "#5e7d96" or "var(--cat-6)"
  apyBps?: number           // APY in basis points e.g. 425 = 4.25%
  routingNumber?: string
  linkedSince: string       // "Feb 2025"
  lastSync: string          // "2 min ago"
  balanceHistory: number[]  // 16 data points in cents for area chart
}

export interface Budget {
  id: string
  name: string
  category: TransactionCategory
  limitInCents: number
  spentInCents: number      // Computed from actual transactions server-side
  percentageUsed: number    // 0–100+ computed server-side via Math.round()
  icon: string              // Icon name key
  color: string             // CSS color
  isOver: boolean           // spentInCents > limitInCents
}

export interface Goal {
  id: string
  name: string
  currentInCents: number
  targetInCents: number
  monthlyContributionInCents: number
  percentageComplete: number   // 0–100 computed server-side
  eta: string                  // "Aug 2026"
  icon: string
  color: string
  vibe: string                 // Subtitle e.g. "Safety net"
}

export interface Bill {
  id: string
  name: string
  amountInCents: number
  dueDate: string              // "Apr 30"
  dueInDays: number
  isAutoPay: boolean
  isUrgent: boolean            // dueInDays <= 3
  category: string
  icon: string
  color: string
}

export interface Subscription {
  id: string
  name: string
  amountMonthlyInCents: number
  nextDate: string
  isUsed: boolean              // Has been opened/used recently
  icon: string
  color: string
}

export interface Insight {
  id: string
  glyph: string
  tag: string
  tone: 'pos' | 'warn' | 'neutral'
  title: string
  body: string
  cta: string
  isPinned: boolean
  sparklineData?: number[]
}

// ---------------------------------------------------------------------------
// Composite API response types
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  user: {
    name: string
    initials: string
    lastSync: string
  }
  today: {
    date: string                     // "Tuesday, April 23"
    safeToSpendInCents: number
    dailyAllowanceInCents: number
    spentTodayInCents: number
    percentSpentToday: number        // 0–100 computed server-side
  }
  cashOnHand: {
    totalInCents: number
    weekDeltaInCents: number
    cashFlowData: number[]           // 30 data points in cents for area chart (1M, kept for compat)
    cashFlowDataByPeriod: Record<'1W' | '1M' | '3M' | '1Y', number[]>
    cashFlowLabelsByPeriod: Record<'1W' | '1M' | '3M' | '1Y', string[]>
  }
  netWorth: {
    totalInCents: number             // totalAssetsInCents - totalLiabilitiesInCents
    monthDeltaInCents: number
    totalAssetsInCents: number
    totalLiabilitiesInCents: number
  }
  recentTransactions: Transaction[]  // Last 7
  upcomingBills: Bill[]              // Next 4
  savingGoals: Goal[]               // Active 3
  spendingCategories: Array<{
    name: string
    amountInCents: number
    percentage: number               // Pre-computed, all slices sum to 100
    color: string
  }>
  totalSpentThisMonthInCents: number
}

export interface BudgetSummary {
  month: string                      // "April 2026"
  daysLeft: number
  totalSpentInCents: number
  totalLimitInCents: number
  percentageUsed: number             // Computed server-side
  remainingInCents: number
  dailyLimitGoingForwardInCents: number  // (totalLimitInCents - totalSpentInCents) / daysLeft
  budgets: Budget[]
  dailySpendHistory: number[]        // 30 data points in cents (one per day) for heatmap
  vsLastMonth: Array<{
    category: string
    deltaInCents: number             // Negative = spent less (good), positive = spent more
    tone: 'pos' | 'neg'
  }>
}

export interface GoalSummary {
  totalSavedInCents: number
  totalTargetInCents: number
  totalMonthlyContributionInCents: number
  savingsRatePercent: number         // Computed server-side
  savingsRateDeltaPoints: number     // Change from last month in percentage points
  activeTransfers: number
  goals: Goal[]
}

export interface BillsSummary {
  periodDays: number                  // 30 | 60 | 90 — selected window
  totalDuePeriodInCents: number       // sum of bills.amountInCents for this window
  totalSubsMonthlyInCents: number
  totalSubsAnnualInCents: number
  bills: Bill[]                       // filtered to dueInDays <= periodDays
  subscriptions: Subscription[]
}

export interface AccountDetail {
  account: Account
  recentTransactions: Transaction[]
  monthlySummary: {
    moneyInInCents: number
    moneyOutInCents: number
    feesInCents: number
    interestInCents: number
  }
  period: '1W' | '1M' | '3M' | '1Y'
  balanceHistoryByPeriod: Record<'1W' | '1M' | '3M' | '1Y', number[]>
  balanceHistoryLabelsByPeriod: Record<'1W' | '1M' | '3M' | '1Y', string[]>
}

export interface TransactionsSummary {
  moneyInInCents: number
  moneyOutInCents: number
  netInCents: number
  dailyAvgOutInCents: number
}

// ---------------------------------------------------------------------------
// Endpoint index (for reference)
// ---------------------------------------------------------------------------
//
// GET /api/dashboard
//   → ApiResponse<DashboardSummary>
//
// GET /api/transactions?page=1&pageSize=20&category=Groceries&accountId=...
//   → ApiResponse<{ items: PaginatedResponse<Transaction>; summary: TransactionsSummary }>
//
// GET /api/budgets
//   → ApiResponse<BudgetSummary>
//
// GET /api/goals
//   → ApiResponse<GoalSummary>
//
// GET /api/bills?days=30|60|90
//   → ApiResponse<BillsSummary>  (bills filtered to dueInDays <= days, default 30)
//
// GET /api/accounts
//   → ApiResponse<Account[]>
//
// GET /api/accounts/[id]?period=1W|1M|3M|1Y
//   → ApiResponse<AccountDetail>
//
// GET /api/notifications
//   → ApiResponse<Notification[]>
//
// PATCH /api/notifications/[id]/read
//   → ApiResponse<{ ok: true }>
//
// GET /api/transactions?page=1&pageSize=20&category=...&accountId=...&q=searchText
//   (q param: text search across merchant and category)
//
// GET /api/settings
//   → ApiResponse<UserSettings>
//
// PATCH /api/settings
//   → ApiResponse<UserSettings>

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationType = 'bill_due' | 'budget_exceeded' | 'large_transaction' | 'goal_milestone' | 'weekly_digest'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  createdAt: string  // ISO datetime "2026-05-28T10:30:00Z"
  route?: string     // Optional deep-link e.g. "/dashboard/bills"
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface NotificationPreferences {
  billsDue: boolean           // Alert when a bill is due in 3 days
  budgetExceeded: boolean     // Alert when a budget category is exceeded
  largeTransactions: boolean  // Alert for transactions above threshold
  weeklyDigest: boolean       // Weekly summary email
  goalMilestones: boolean     // Alert when a savings goal hits a milestone
}

export interface UserSettings {
  profile: {
    name: string
    email: string
    initials: string
    avatarUrl?: string
    currency: 'USD' | 'INR' | 'EUR'
    timezone: string
  }
  notifications: NotificationPreferences
  security: {
    activeSessions: number
    twoFactorEnabled: boolean  // Deprecated — always false with Google OAuth
    lastPasswordChange: string // Deprecated — always '' with Google OAuth
  }
}
