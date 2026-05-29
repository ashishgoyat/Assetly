/**
 * Data access layer — backed by SQLite via @libsql/client + Drizzle ORM.
 * All monetary values are in cents (smallest USD unit).
 * Function signatures are unchanged from the in-memory version
 * so API routes and server actions need no changes.
 */

import { db, ensureDb } from '@/lib/db/index'
import {
  transactionsTable,
  accountsTable,
  budgetsTable,
  goalsTable,
  billsTable,
  subscriptionsTable,
  insightsTable,
  usersTable,
} from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import type {
  Transaction,
  Account,
  Budget,
  Goal,
  Bill,
  Subscription,
  Insight,
  Notification,
} from '@/contracts/api-contracts'

// ---------------------------------------------------------------------------
// cashFlowData — static chart constant, no need to DB-ify
// ---------------------------------------------------------------------------

export { cashFlowData, cashFlowDataByPeriod } from '@/lib/data/seed-data'

// ---------------------------------------------------------------------------
// Notifications — static seed data, no DB table needed
// ---------------------------------------------------------------------------

import { SEED_NOTIFICATIONS } from '@/lib/data/seed-data'

export async function getNotifications(): Promise<Notification[]> {
  // TODO: replace with DB query when notifications become persistent
  return SEED_NOTIFICATIONS
}

// ---------------------------------------------------------------------------
// Row-to-domain mappers
// ---------------------------------------------------------------------------

type TransactionRow = typeof transactionsTable.$inferSelect
type AccountRow = typeof accountsTable.$inferSelect
type BudgetRow = typeof budgetsTable.$inferSelect
type GoalRow = typeof goalsTable.$inferSelect
type BillRow = typeof billsTable.$inferSelect
type SubscriptionRow = typeof subscriptionsTable.$inferSelect
type InsightRow = typeof insightsTable.$inferSelect

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    date: row.date,
    time: row.time,
    merchant: row.merchant,
    category: row.category as Transaction['category'],
    accountLabel: row.accountLabel,
    amountInCents: row.amountInCents,
    type: row.type as Transaction['type'],
    status: row.status as Transaction['status'],
    ...(row.note != null ? { note: row.note } : {}),
  }
}

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    number: row.number,
    balanceInCents: row.balanceInCents,
    weekDeltaInCents: row.weekDeltaInCents,
    type: row.type as Account['type'],
    color: row.color,
    ...(row.apyBps != null ? { apyBps: row.apyBps } : {}),
    ...(row.routingNumber != null ? { routingNumber: row.routingNumber } : {}),
    linkedSince: row.linkedSince,
    lastSync: row.lastSync,
    // balanceHistory is stored as JSON TEXT — parse back to number[]
    balanceHistory: JSON.parse(row.balanceHistory) as number[],
  }
}

function mapBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Budget['category'],
    limitInCents: row.limitInCents,
    spentInCents: row.spentInCents,
    percentageUsed: row.percentageUsed,
    icon: row.icon,
    color: row.color,
    isOver: Boolean(row.isOver),
  }
}

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    currentInCents: row.currentInCents,
    targetInCents: row.targetInCents,
    monthlyContributionInCents: row.monthlyContributionInCents,
    percentageComplete: row.percentageComplete,
    eta: row.eta,
    icon: row.icon,
    color: row.color,
    vibe: row.vibe,
  }
}

function mapBill(row: BillRow): Bill {
  return {
    id: row.id,
    name: row.name,
    amountInCents: row.amountInCents,
    dueDate: row.dueDate,
    dueInDays: row.dueInDays,
    isAutoPay: Boolean(row.isAutoPay),
    isUrgent: Boolean(row.isUrgent),
    category: row.category,
    icon: row.icon,
    color: row.color,
  }
}

function mapSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    amountMonthlyInCents: row.amountMonthlyInCents,
    nextDate: row.nextDate,
    isUsed: Boolean(row.isUsed),
    icon: row.icon,
    color: row.color,
  }
}

function mapInsight(row: InsightRow): Insight {
  return {
    id: row.id,
    glyph: row.glyph,
    tag: row.tag,
    tone: row.tone as Insight['tone'],
    title: row.title,
    body: row.body,
    cta: row.cta,
    isPinned: Boolean(row.isPinned),
    ...(row.sparklineData != null
      ? { sparklineData: JSON.parse(row.sparklineData) as number[] }
      : {}),
  }
}

// ---------------------------------------------------------------------------
// Accessor functions — same signatures as before, now query SQLite
// ---------------------------------------------------------------------------

export async function getTransactions(): Promise<Transaction[]> {
  await ensureDb()
  const rows = await db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.date), desc(transactionsTable.time))
  return rows.map(mapTransaction)
}

export async function getAccounts(): Promise<Account[]> {
  await ensureDb()
  const rows = await db.select().from(accountsTable)
  return rows.map(mapAccount)
}

export async function getBudgets(): Promise<Budget[]> {
  await ensureDb()
  const rows = await db.select().from(budgetsTable)
  return rows.map(mapBudget)
}

export async function getGoals(): Promise<Goal[]> {
  await ensureDb()
  const rows = await db.select().from(goalsTable)
  return rows.map(mapGoal)
}

export async function getBills(): Promise<Bill[]> {
  await ensureDb()
  const rows = await db.select().from(billsTable)
  return rows.map(mapBill)
}

export async function getSubscriptions(): Promise<Subscription[]> {
  await ensureDb()
  const rows = await db.select().from(subscriptionsTable)
  return rows.map(mapSubscription)
}

export async function getInsights(): Promise<Insight[]> {
  await ensureDb()
  const rows = await db.select().from(insightsTable)
  return rows.map(mapInsight)
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  await ensureDb()
  const rows = await db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.id, id))
  return rows[0] ? mapAccount(rows[0]) : undefined
}

// ---------------------------------------------------------------------------
// Insert functions — replace the mutable array exports used by server actions
// ---------------------------------------------------------------------------

export async function insertTransaction(tx: Transaction): Promise<void> {
  await ensureDb()
  await db.insert(transactionsTable).values({
    id: tx.id,
    date: tx.date,
    time: tx.time,
    merchant: tx.merchant,
    category: tx.category,
    accountLabel: tx.accountLabel,
    amountInCents: tx.amountInCents,
    type: tx.type,
    status: tx.status,
    note: tx.note ?? null,
  })
}

export async function insertGoal(goal: Goal): Promise<void> {
  await ensureDb()
  await db.insert(goalsTable).values({
    id: goal.id,
    name: goal.name,
    currentInCents: goal.currentInCents,
    targetInCents: goal.targetInCents,
    monthlyContributionInCents: goal.monthlyContributionInCents,
    percentageComplete: goal.percentageComplete,
    eta: goal.eta,
    icon: goal.icon,
    color: goal.color,
    vibe: goal.vibe,
  })
}

export async function getGoalById(id: string): Promise<Goal | undefined> {
  await ensureDb()
  const rows = await db.select().from(goalsTable).where(eq(goalsTable.id, id))
  return rows[0] ? mapGoal(rows[0]) : undefined
}

export async function updateGoal(
  id: string,
  updates: {
    currentInCents?: number
    monthlyContributionInCents?: number
    percentageComplete?: number
    eta?: string
  },
): Promise<void> {
  await ensureDb()
  await db.update(goalsTable).set(updates).where(eq(goalsTable.id, id))
}

export async function removeGoal(id: string): Promise<void> {
  await ensureDb()
  await db.delete(goalsTable).where(eq(goalsTable.id, id))
}

export async function insertBill(bill: Bill): Promise<void> {
  await ensureDb()
  await db.insert(billsTable).values({
    id: bill.id,
    name: bill.name,
    amountInCents: bill.amountInCents,
    dueDate: bill.dueDate,
    dueInDays: bill.dueInDays,
    isAutoPay: bill.isAutoPay,
    isUrgent: bill.isUrgent,
    category: bill.category,
    icon: bill.icon,
    color: bill.color,
  })
}

export async function removeTransaction(id: string): Promise<void> {
  await ensureDb()
  await db.delete(transactionsTable).where(eq(transactionsTable.id, id))
}

export async function updateTransaction(
  id: string,
  updates: {
    merchant?: string
    category?: string
    accountLabel?: string
    status?: string
    note?: string | null
  },
): Promise<void> {
  await ensureDb()
  await db
    .update(transactionsTable)
    .set({
      ...(updates.merchant !== undefined ? { merchant: updates.merchant } : {}),
      ...(updates.category !== undefined ? { category: updates.category } : {}),
      ...(updates.accountLabel !== undefined ? { accountLabel: updates.accountLabel } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.note !== undefined ? { note: updates.note } : {}),
    })
    .where(eq(transactionsTable.id, id))
}

export async function insertAccount(account: Account): Promise<void> {
  await ensureDb()
  await db.insert(accountsTable).values({
    id: account.id,
    name: account.name,
    number: account.number,
    balanceInCents: account.balanceInCents,
    weekDeltaInCents: account.weekDeltaInCents,
    type: account.type,
    color: account.color,
    apyBps: account.apyBps ?? null,
    routingNumber: account.routingNumber ?? null,
    linkedSince: account.linkedSince,
    lastSync: account.lastSync,
    balanceHistory: JSON.stringify(account.balanceHistory),
  })
}

export async function insertBudget(budget: Budget): Promise<void> {
  // TODO: replace with DB query
  await ensureDb()
  await db.insert(budgetsTable).values({
    id: budget.id,
    name: budget.name,
    category: budget.category,
    limitInCents: budget.limitInCents,
    spentInCents: budget.spentInCents,
    percentageUsed: budget.percentageUsed,
    icon: budget.icon,
    color: budget.color,
    isOver: budget.isOver,
  })
}

export async function updateBudget(
  id: string,
  updates: { limitInCents?: number; name?: string },
): Promise<void> {
  // TODO: replace with DB query
  await ensureDb()
  await db.update(budgetsTable).set(updates).where(eq(budgetsTable.id, id))
}

export async function removeBudget(id: string): Promise<void> {
  // TODO: replace with DB query
  await ensureDb()
  await db.delete(budgetsTable).where(eq(budgetsTable.id, id))
}

// ---------------------------------------------------------------------------
// User functions
// ---------------------------------------------------------------------------

type UserRow = typeof usersTable.$inferSelect

export async function getUserByEmail(email: string): Promise<UserRow | undefined> {
  await ensureDb()
  const rows = await db.select().from(usersTable).where(eq(usersTable.email, email))
  return rows[0]
}

export async function createUser(data: {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}): Promise<void> {
  await ensureDb()
  await db.insert(usersTable).values({
    id: data.id,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    createdAt: data.createdAt,
  })
}
