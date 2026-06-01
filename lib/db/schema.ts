/**
 * Drizzle ORM schema definitions for Assetly.
 * All monetary values are stored as integers (cents).
 * Array fields (balanceHistory, sparklineData) are stored as JSON TEXT.
 */

import { integer, sqliteTable, text, real, primaryKey } from 'drizzle-orm/sqlite-core'

// ---------------------------------------------------------------------------
// transactions
// ---------------------------------------------------------------------------

export const transactionsTable = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  date: text('date').notNull(),       // ISO date "2026-04-23"
  time: text('time').notNull(),       // "11:42 AM"
  merchant: text('merchant').notNull(),
  category: text('category').notNull(),
  accountLabel: text('account_label').notNull(),
  amountInCents: integer('amount_in_cents').notNull(),
  type: text('type').notNull(),       // 'income' | 'expense'
  status: text('status').notNull(),   // 'posted' | 'pending'
  note: text('note'),
})

// ---------------------------------------------------------------------------
// accounts
// ---------------------------------------------------------------------------

export const accountsTable = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  number: text('number').notNull(),
  balanceInCents: integer('balance_in_cents').notNull(),
  weekDeltaInCents: integer('week_delta_in_cents').notNull(),
  type: text('type').notNull(),        // 'checking' | 'savings' | 'investment'
  color: text('color').notNull(),
  apyBps: integer('apy_bps'),
  routingNumber: text('routing_number'),
  linkedSince: text('linked_since').notNull(),
  lastSync: text('last_sync').notNull(),
  balanceHistory: text('balance_history').notNull(), // JSON TEXT: number[]
})

// ---------------------------------------------------------------------------
// budgets
// ---------------------------------------------------------------------------

export const budgetsTable = sqliteTable('budgets', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  category: text('category').notNull(),
  limitInCents: integer('limit_in_cents').notNull(),
  spentInCents: integer('spent_in_cents').notNull(),
  percentageUsed: real('percentage_used').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  isOver: integer('is_over', { mode: 'boolean' }).notNull(),
})

// ---------------------------------------------------------------------------
// goals
// ---------------------------------------------------------------------------

export const goalsTable = sqliteTable('goals', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  currentInCents: integer('current_in_cents').notNull(),
  targetInCents: integer('target_in_cents').notNull(),
  monthlyContributionInCents: integer('monthly_contribution_in_cents').notNull(),
  percentageComplete: real('percentage_complete').notNull(),
  eta: text('eta').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  vibe: text('vibe').notNull(),
})

// ---------------------------------------------------------------------------
// bills
// ---------------------------------------------------------------------------

export const billsTable = sqliteTable('bills', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  amountInCents: integer('amount_in_cents').notNull(),
  dueDate: text('due_date').notNull(),
  dueInDays: integer('due_in_days').notNull(),
  isAutoPay: integer('is_auto_pay', { mode: 'boolean' }).notNull(),
  isUrgent: integer('is_urgent', { mode: 'boolean' }).notNull(),
  category: text('category').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
})

// ---------------------------------------------------------------------------
// subscriptions
// ---------------------------------------------------------------------------

export const subscriptionsTable = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  amountMonthlyInCents: integer('amount_monthly_in_cents').notNull(),
  nextDate: text('next_date').notNull(),
  isUsed: integer('is_used', { mode: 'boolean' }).notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
})

// ---------------------------------------------------------------------------
// insights
// ---------------------------------------------------------------------------

export const insightsTable = sqliteTable('insights', {
  id: text('id').primaryKey(),
  glyph: text('glyph').notNull(),
  tag: text('tag').notNull(),
  tone: text('tone').notNull(),        // 'pos' | 'warn' | 'neutral'
  title: text('title').notNull(),
  body: text('body').notNull(),
  cta: text('cta').notNull(),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull(),
  sparklineData: text('sparkline_data'), // JSON TEXT: number[] | null
})

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------

export const usersTable = sqliteTable('users', {
  id:             text('id').primaryKey(),
  name:           text('name').notNull(),
  email:          text('email').notNull(),
  passwordHash:   text('password_hash'),
  googleId:       text('google_id'),
  avatarUrl:      text('avatar_url'),
  sessionVersion: integer('session_version').notNull().default(0),
  createdAt:      text('created_at').notNull(),
})

// ---------------------------------------------------------------------------
// notification reads
// ---------------------------------------------------------------------------

export const notificationReadsTable = sqliteTable('notification_reads', {
  userId:         text('user_id').notNull(),
  notificationId: text('notification_id').notNull(),
  readAt:         text('read_at').notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.notificationId] }) }))

// ---------------------------------------------------------------------------
// notification emails sent
// ---------------------------------------------------------------------------

export const notificationEmailsSentTable = sqliteTable('notification_emails_sent', {
  userId:         text('user_id').notNull(),
  notificationId: text('notification_id').notNull(),
  sentAt:         text('sent_at').notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.notificationId] }) }))
