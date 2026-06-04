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
  notificationReadsTable,
  notificationEmailsSentTable,
  userSessionsTable,
} from '@/lib/db/schema'
import { desc, eq, and, gte, gt, isNull, sql } from 'drizzle-orm'
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

// Notification import kept for type usage only
// getNotifications replaced by generateNotifications (see bottom of file)

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

export async function getTransactions(userId?: string): Promise<Transaction[]> {
  await ensureDb()
  const rows = await db
    .select()
    .from(transactionsTable)
    .where(userId !== undefined ? eq(transactionsTable.userId, userId) : undefined)
    .orderBy(desc(transactionsTable.date), desc(transactionsTable.time))
  return rows.map(mapTransaction)
}

export async function getAccounts(userId?: string): Promise<Account[]> {
  await ensureDb()
  const rows = await db
    .select()
    .from(accountsTable)
    .where(userId !== undefined ? eq(accountsTable.userId, userId) : undefined)
  return rows.map(mapAccount)
}

export async function getBudgets(userId?: string): Promise<Budget[]> {
  await ensureDb()
  const rows = await db
    .select()
    .from(budgetsTable)
    .where(userId !== undefined ? eq(budgetsTable.userId, userId) : undefined)
  return rows.map(mapBudget)
}

export async function getGoals(userId?: string): Promise<Goal[]> {
  await ensureDb()
  const rows = await db
    .select()
    .from(goalsTable)
    .where(userId !== undefined ? eq(goalsTable.userId, userId) : undefined)
  return rows.map(mapGoal)
}

export async function getBills(userId?: string): Promise<Bill[]> {
  await ensureDb()
  const rows = await db
    .select()
    .from(billsTable)
    .where(userId !== undefined ? eq(billsTable.userId, userId) : undefined)
  return rows.map(mapBill)
}

export async function getSubscriptions(userId?: string): Promise<Subscription[]> {
  await ensureDb()
  const rows = await db
    .select()
    .from(subscriptionsTable)
    .where(userId !== undefined ? eq(subscriptionsTable.userId, userId) : undefined)
  return rows.map(mapSubscription)
}

export async function getInsights(): Promise<Insight[]> {
  await ensureDb()
  const rows = await db.select().from(insightsTable)
  return rows.map(mapInsight)
}

export async function getAccountById(id: string, userId?: string): Promise<Account | undefined> {
  await ensureDb()
  const rows = await db
    .select()
    .from(accountsTable)
    .where(
      userId !== undefined
        ? and(eq(accountsTable.id, id), eq(accountsTable.userId, userId))
        : eq(accountsTable.id, id),
    )
  return rows[0] ? mapAccount(rows[0]) : undefined
}

// ---------------------------------------------------------------------------
// Insert functions — replace the mutable array exports used by server actions
// ---------------------------------------------------------------------------

export async function insertTransaction(tx: Transaction, userId?: string): Promise<void> {
  await ensureDb()
  await db.insert(transactionsTable).values({
    id: tx.id,
    userId: userId ?? null,
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

export async function insertGoal(goal: Goal, userId?: string): Promise<void> {
  await ensureDb()
  await db.insert(goalsTable).values({
    id: goal.id,
    userId: userId ?? null,
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

export async function getGoalById(id: string, userId?: string): Promise<Goal | undefined> {
  await ensureDb()
  const rows = await db
    .select()
    .from(goalsTable)
    .where(
      userId !== undefined
        ? and(eq(goalsTable.id, id), eq(goalsTable.userId, userId))
        : eq(goalsTable.id, id),
    )
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
  userId?: string,
): Promise<void> {
  await ensureDb()
  await db
    .update(goalsTable)
    .set(updates)
    .where(
      userId !== undefined
        ? and(eq(goalsTable.id, id), eq(goalsTable.userId, userId))
        : eq(goalsTable.id, id),
    )
}

export async function removeGoal(id: string, userId?: string): Promise<void> {
  await ensureDb()
  await db
    .delete(goalsTable)
    .where(
      userId !== undefined
        ? and(eq(goalsTable.id, id), eq(goalsTable.userId, userId))
        : eq(goalsTable.id, id),
    )
}

export async function insertBill(bill: Bill, userId?: string): Promise<void> {
  await ensureDb()
  await db.insert(billsTable).values({
    id: bill.id,
    userId: userId ?? null,
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

export async function updateBill(
  id: string,
  updates: {
    name?: string
    amountInCents?: number
    dueDate?: string
    dueInDays?: number
    isAutoPay?: boolean
    isUrgent?: boolean
    category?: string
  },
  userId?: string,
): Promise<void> {
  await ensureDb()
  await db
    .update(billsTable)
    .set(updates)
    .where(
      userId !== undefined
        ? and(eq(billsTable.id, id), eq(billsTable.userId, userId))
        : eq(billsTable.id, id),
    )
}

export async function removeBill(id: string, userId?: string): Promise<void> {
  await ensureDb()
  await db
    .delete(billsTable)
    .where(
      userId !== undefined
        ? and(eq(billsTable.id, id), eq(billsTable.userId, userId))
        : eq(billsTable.id, id),
    )
}

export async function insertSubscription(sub: Subscription, userId?: string): Promise<void> {
  await ensureDb()
  await db.insert(subscriptionsTable).values({
    id: sub.id,
    userId: userId ?? null,
    name: sub.name,
    amountMonthlyInCents: sub.amountMonthlyInCents,
    nextDate: sub.nextDate,
    isUsed: sub.isUsed,
    icon: sub.icon,
    color: sub.color,
  })
}

export async function updateSubscription(
  id: string,
  updates: {
    name?: string
    amountMonthlyInCents?: number
    nextDate?: string
    isUsed?: boolean
  },
  userId?: string,
): Promise<void> {
  await ensureDb()
  await db
    .update(subscriptionsTable)
    .set(updates)
    .where(
      userId !== undefined
        ? and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId))
        : eq(subscriptionsTable.id, id),
    )
}

export async function removeSubscription(id: string, userId?: string): Promise<void> {
  await ensureDb()
  await db
    .delete(subscriptionsTable)
    .where(
      userId !== undefined
        ? and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId))
        : eq(subscriptionsTable.id, id),
    )
}

export async function removeTransaction(id: string, userId?: string): Promise<void> {
  await ensureDb()
  await db
    .delete(transactionsTable)
    .where(
      userId !== undefined
        ? and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId))
        : eq(transactionsTable.id, id),
    )
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
  userId?: string,
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
    .where(
      userId !== undefined
        ? and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId))
        : eq(transactionsTable.id, id),
    )
}

export async function updateAccount(
  id: string,
  patch: Partial<Pick<Account, 'name' | 'balanceInCents'>>,
  userId?: string,
): Promise<void> {
  // TODO: replace with DB query
  await ensureDb()
  await db
    .update(accountsTable)
    .set(patch)
    .where(
      userId !== undefined
        ? and(eq(accountsTable.id, id), eq(accountsTable.userId, userId))
        : eq(accountsTable.id, id),
    )
}

export async function removeAccount(id: string, userId?: string): Promise<void> {
  // TODO: replace with DB query
  await ensureDb()
  await db
    .delete(accountsTable)
    .where(
      userId !== undefined
        ? and(eq(accountsTable.id, id), eq(accountsTable.userId, userId))
        : eq(accountsTable.id, id),
    )
}

export async function insertAccount(account: Account, userId?: string): Promise<void> {
  await ensureDb()
  await db.insert(accountsTable).values({
    id: account.id,
    userId: userId ?? null,
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

export async function insertBudget(budget: Budget, userId?: string): Promise<void> {
  await ensureDb()
  await db.insert(budgetsTable).values({
    id: budget.id,
    userId: userId ?? null,
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
  userId?: string,
): Promise<void> {
  await ensureDb()
  await db
    .update(budgetsTable)
    .set(updates)
    .where(
      userId !== undefined
        ? and(eq(budgetsTable.id, id), eq(budgetsTable.userId, userId))
        : eq(budgetsTable.id, id),
    )
}

export async function removeBudget(id: string, userId?: string): Promise<void> {
  await ensureDb()
  await db
    .delete(budgetsTable)
    .where(
      userId !== undefined
        ? and(eq(budgetsTable.id, id), eq(budgetsTable.userId, userId))
        : eq(budgetsTable.id, id),
    )
}

// ---------------------------------------------------------------------------
// Seed data claiming — first user to sign in inherits all unclaimed rows
// ---------------------------------------------------------------------------

export async function claimSeedData(userId: string): Promise<void> {
  await ensureDb()
  // Check if this user already has any data
  const existing = await db
    .select({ id: accountsTable.id })
    .from(accountsTable)
    .where(eq(accountsTable.userId, userId))
    .limit(1)
  if (existing.length > 0) return // user already has data

  // Claim all unclaimed (NULL userId) rows for this user
  await db.update(accountsTable).set({ userId }).where(isNull(accountsTable.userId))
  await db.update(transactionsTable).set({ userId }).where(isNull(transactionsTable.userId))
  await db.update(budgetsTable).set({ userId }).where(isNull(budgetsTable.userId))
  await db.update(goalsTable).set({ userId }).where(isNull(goalsTable.userId))
  await db.update(billsTable).set({ userId }).where(isNull(billsTable.userId))
  await db.update(subscriptionsTable).set({ userId }).where(isNull(subscriptionsTable.userId))
}

// ---------------------------------------------------------------------------
// User functions
// ---------------------------------------------------------------------------

export type UserRow = typeof usersTable.$inferSelect

export async function getUserByEmail(email: string): Promise<UserRow | undefined> {
  await ensureDb()
  const rows = await db.select().from(usersTable).where(eq(usersTable.email, email))
  return rows[0]
}

export async function getUserById(id: string): Promise<UserRow | undefined> {
  // TODO: replace with DB query
  await ensureDb()
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, id))
  return rows[0]
}

export async function updateUser(
  id: string,
  updates: { name?: string; email?: string; passwordHash?: string },
): Promise<void> {
  // TODO: replace with DB query
  await ensureDb()
  await db.update(usersTable).set(updates).where(eq(usersTable.id, id))
}

export async function clearAllUserData(userId: string): Promise<void> {
  await ensureDb()
  await db.delete(transactionsTable).where(eq(transactionsTable.userId, userId))
  await db.delete(billsTable).where(eq(billsTable.userId, userId))
  await db.delete(subscriptionsTable).where(eq(subscriptionsTable.userId, userId))
  await db.delete(goalsTable).where(eq(goalsTable.userId, userId))
}

export async function removeUser(id: string): Promise<void> {
  await ensureDb()
  await db.delete(transactionsTable).where(eq(transactionsTable.userId, id))
  await db.delete(accountsTable).where(eq(accountsTable.userId, id))
  await db.delete(budgetsTable).where(eq(budgetsTable.userId, id))
  await db.delete(goalsTable).where(eq(goalsTable.userId, id))
  await db.delete(billsTable).where(eq(billsTable.userId, id))
  await db.delete(subscriptionsTable).where(eq(subscriptionsTable.userId, id))
  await db.delete(notificationReadsTable).where(eq(notificationReadsTable.userId, id))
  await db.delete(notificationEmailsSentTable).where(eq(notificationEmailsSentTable.userId, id))
  await db.delete(usersTable).where(eq(usersTable.id, id))
}

export async function createUser(data: {
  id: string
  name: string
  email: string
  passwordHash: string | null
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

export async function getUserByGoogleId(googleId: string): Promise<UserRow | null> {
  // TODO: replace with DB query
  await ensureDb()
  const rows = await db.select().from(usersTable).where(eq(usersTable.googleId, googleId)).limit(1)
  return rows[0] ?? null
}

export async function upsertGoogleUser({
  googleId, email, name, avatarUrl,
}: { googleId: string; email: string; name: string; avatarUrl: string }): Promise<UserRow> {
  // Try by googleId first
  const user = await getUserByGoogleId(googleId)
  if (user) {
    await db.update(usersTable).set({ name, avatarUrl, googleId }).where(eq(usersTable.id, user.id))
    return { ...user, name, avatarUrl, googleId }
  }
  // Try by email
  const existingByEmail = await getUserByEmail(email)
  if (existingByEmail) {
    await db.update(usersTable).set({ googleId, avatarUrl }).where(eq(usersTable.id, existingByEmail.id))
    return { ...existingByEmail, googleId, avatarUrl }
  }
  // Create new
  const newUser: UserRow = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: null,
    googleId,
    avatarUrl,
    sessionVersion: 0,
    createdAt: new Date().toISOString(),
  }
  await db.insert(usersTable).values(newUser)
  return newUser
}

export async function getSessionVersion(userId: string): Promise<number> {
  // TODO: replace with DB query
  await ensureDb()
  const rows = await db.select({ sv: usersTable.sessionVersion }).from(usersTable).where(eq(usersTable.id, userId)).limit(1)
  return rows[0]?.sv ?? 0
}

export async function incrementSessionVersion(userId: string): Promise<void> {
  // TODO: replace with DB query
  await ensureDb()
  await db.update(usersTable).set({ sessionVersion: sql`${usersTable.sessionVersion} + 1` }).where(eq(usersTable.id, userId))
}

// ---------------------------------------------------------------------------
// User sessions — per-sign-in tracking for active session count
// ---------------------------------------------------------------------------

export async function insertUserSession(userId: string): Promise<void> {
  // TODO: replace with DB query
  await ensureDb()
  const now = new Date()
  await db.insert(userSessionsTable).values({
    id: crypto.randomUUID(),
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })
}

export async function countActiveSessions(userId: string): Promise<number> {
  // TODO: replace with DB query
  await ensureDb()
  const rows = await db
    .select({ id: userSessionsTable.id })
    .from(userSessionsTable)
    .where(
      and(
        eq(userSessionsTable.userId, userId),
        gt(userSessionsTable.expiresAt, new Date().toISOString()),
      ),
    )
  return rows.length
}

export async function clearUserSessions(userId: string): Promise<void> {
  // TODO: replace with DB query
  await ensureDb()
  await db.delete(userSessionsTable).where(eq(userSessionsTable.userId, userId))
}

// ---------------------------------------------------------------------------
// Notification reads
// ---------------------------------------------------------------------------

export async function getNotificationReads(userId: string): Promise<Set<string>> {
  await ensureDb()
  const rows = await db.select({ nid: notificationReadsTable.notificationId })
    .from(notificationReadsTable)
    .where(eq(notificationReadsTable.userId, userId))
  return new Set(rows.map(r => r.nid))
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  await ensureDb()
  await db.insert(notificationReadsTable).values({
    userId,
    notificationId,
    readAt: new Date().toISOString(),
  }).onConflictDoNothing()
}

export async function markAllNotificationsRead(userId: string, notificationIds: string[]): Promise<void> {
  if (notificationIds.length === 0) return
  await ensureDb()
  const now = new Date().toISOString()
  await db.insert(notificationReadsTable).values(
    notificationIds.map(nid => ({ userId, notificationId: nid, readAt: now }))
  ).onConflictDoNothing()
}

// ---------------------------------------------------------------------------
// Notification emails sent
// ---------------------------------------------------------------------------

export async function getEmailedNotifications(userId: string): Promise<Set<string>> {
  await ensureDb()
  const rows = await db.select({ nid: notificationEmailsSentTable.notificationId })
    .from(notificationEmailsSentTable)
    .where(eq(notificationEmailsSentTable.userId, userId))
  return new Set(rows.map(r => r.nid))
}

export async function recordEmailedNotification(userId: string, notificationId: string): Promise<void> {
  await ensureDb()
  await db.insert(notificationEmailsSentTable).values({
    userId,
    notificationId,
    sentAt: new Date().toISOString(),
  }).onConflictDoNothing()
}

// ---------------------------------------------------------------------------
// Dynamic notification generation
// ---------------------------------------------------------------------------

export async function generateNotifications(
  userId?: string,
  prefs?: import('@/contracts/api-contracts').NotificationPreferences,
): Promise<Notification[]> {
  await ensureDb()
  const notifications: Notification[] = []
  const now = new Date()

  const effectivePrefs = prefs ?? {
    billsDue: true,
    budgetExceeded: true,
    largeTransactions: true,
    weeklyDigest: true,
    goalMilestones: true,
  }

  // bill_due: bills due within 3 days (compute live from dueDate to avoid stale DB values)
  if (effectivePrefs.billsDue) {
    const bills = await getBills(userId)
    for (const bill of bills) {
      const liveDueInDays = computeDueInDays(bill.dueDate)
      if (liveDueInDays >= 0 && liveDueInDays <= 3) {
        const urgency = liveDueInDays === 0 ? 'today' : liveDueInDays === 1 ? 'tomorrow' : `in ${liveDueInDays} days`
        notifications.push({
          id: `bill_due_${bill.id}`,
          type: 'bill_due',
          title: `${bill.name} due ${urgency}`,
          body: `${formatCurrencyNotif(bill.amountInCents)} due ${urgency}. Check your bills.`,
          isRead: false,
          createdAt: now.toISOString(),
          route: '/dashboard/bills',
        })
      }
    }
  }

  // budget_exceeded: budgets where spent > limit
  if (effectivePrefs.budgetExceeded) {
    const budgetRows = await db
      .select()
      .from(budgetsTable)
      .where(userId !== undefined ? eq(budgetsTable.userId, userId) : undefined)
    for (const b of budgetRows) {
      if (b.spentInCents > b.limitInCents) {
        notifications.push({
          id: `budget_exceeded_${b.id}`,
          type: 'budget_exceeded',
          title: `${b.name} budget exceeded`,
          body: `You've spent ${formatCurrencyNotif(b.spentInCents)} of your ${formatCurrencyNotif(b.limitInCents)} ${b.name} budget.`,
          isRead: false,
          createdAt: now.toISOString(),
          route: '/dashboard/budgets',
        })
      }
    }
  }

  // large_transaction: expense transactions in last 7 days with amountInCents > 10000
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  if (effectivePrefs.largeTransactions) {
    const largeTxRows = await db.select().from(transactionsTable)
      .where(and(
        userId !== undefined ? eq(transactionsTable.userId, userId) : undefined,
        eq(transactionsTable.type, 'expense'),
        gte(transactionsTable.date, sevenDaysAgo),
        gt(transactionsTable.amountInCents, 10000),
      ))
    for (const tx of largeTxRows) {
      notifications.push({
        id: `large_tx_${tx.id}`,
        type: 'large_transaction',
        title: `Large transaction: ${tx.merchant}`,
        body: `${formatCurrencyNotif(tx.amountInCents)} at ${tx.merchant} on ${tx.date}.`,
        isRead: false,
        createdAt: parseTxDateTime(tx.date, tx.time),
        route: '/dashboard/transactions',
      })
    }
  }

  // goal_milestone: goals at 25/50/75/100% thresholds
  if (effectivePrefs.goalMilestones) {
    const goalRows = await db
      .select()
      .from(goalsTable)
      .where(userId !== undefined ? eq(goalsTable.userId, userId) : undefined)
    const milestones = [100, 75, 50, 25]
    for (const g of goalRows) {
      const pct = g.targetInCents > 0 ? Math.floor((g.currentInCents / g.targetInCents) * 100) : 0
      for (const m of milestones) {
        if (pct >= m) {
          notifications.push({
            id: `goal_milestone_${g.id}_${m}`,
            type: 'goal_milestone',
            title: `Goal "${g.name}" is ${m}% complete!`,
            body: `You've saved ${formatCurrencyNotif(g.currentInCents)} of your ${formatCurrencyNotif(g.targetInCents)} goal.`,
            isRead: false,
            createdAt: now.toISOString(),
            route: '/dashboard/goals',
          })
          break // only the highest milestone reached
        }
      }
    }
  }

  // weekly_digest: one per week
  if (effectivePrefs.weeklyDigest) {
    const weekId = getISOWeek(now)
    const allTxs = await db.select().from(transactionsTable)
      .where(and(
        userId !== undefined ? eq(transactionsTable.userId, userId) : undefined,
        eq(transactionsTable.type, 'expense'),
        gte(transactionsTable.date, sevenDaysAgo),
      ))
    const weekSpent = allTxs.reduce((s, t) => s + t.amountInCents, 0)
    if (weekSpent > 0) {
      notifications.push({
        id: `weekly_digest_${weekId}`,
        type: 'weekly_digest',
        title: 'Weekly spending digest',
        body: `You spent ${formatCurrencyNotif(weekSpent)} this week across ${allTxs.length} transactions.`,
        isRead: false,
        createdAt: now.toISOString(),
        route: '/dashboard/transactions',
      })
    }
  }

  // Sort: unread first, then newest createdAt first, cap at 20
  return notifications
    .sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
      return b.createdAt.localeCompare(a.createdAt)
    })
    .slice(0, 20)
}

// Converts a transaction's stored date ("2026-06-04") + time ("3:42 PM") into an
// ISO 8601 string so large_transaction notifications get the real event time, not
// a hardcoded midnight-UTC timestamp that makes relative-time display wrong.
function parseTxDateTime(date: string, time: string): string {
  const m = time.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (!m) return `${date}T00:00:00.000Z`
  let h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0
  return `${date}T${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00.000Z`
}

function computeDueInDays(dueDate: string): number {
  const now = new Date()
  const year = now.getFullYear()
  let d = new Date(`${dueDate} ${year}`)
  // If the parsed date is more than 60 days in the past, assume it's next year
  if (d.getTime() < now.getTime() - 60 * 24 * 60 * 60 * 1000) {
    d = new Date(`${dueDate} ${year + 1}`)
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatCurrencyNotif(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function getISOWeek(d: Date): string {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Account balance adjustment helpers
// ---------------------------------------------------------------------------

/**
 * Adjusts an account's balance by deltaInCents (positive = add, negative = subtract).
 * Used by transfer actions and auto-save. Looks up account by ID.
 */
export async function adjustAccountBalance(
  accountId: string,
  userId: string,
  deltaInCents: number,
): Promise<void> {
  await ensureDb()
  await db
    .update(accountsTable)
    .set({ balanceInCents: sql`${accountsTable.balanceInCents} + ${deltaInCents}` })
    .where(and(eq(accountsTable.id, accountId), eq(accountsTable.userId, userId)))
}

export async function updateAccountLastSync(id: string, userId: string): Promise<void> {
  await ensureDb()
  await db
    .update(accountsTable)
    .set({ lastSync: 'Just now' })
    .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
}

/**
 * Adjusts an account's balance by deltaInCents, found by matching the accountLabel
 * string (format: "Account Name ··XXXX") against name + ' ' + number in the DB.
 * Used by createTransaction to update balance after inserting a transaction.
 */
export async function adjustAccountBalanceByLabel(
  accountLabel: string,
  userId: string,
  deltaInCents: number,
): Promise<void> {
  await ensureDb()
  const rows = await db
    .select({ id: accountsTable.id, name: accountsTable.name, number: accountsTable.number })
    .from(accountsTable)
    .where(eq(accountsTable.userId, userId))
  const account = rows.find((r) => `${r.name} ${r.number}` === accountLabel)
  if (!account) return // label doesn't match any account — skip silently
  await db
    .update(accountsTable)
    .set({ balanceInCents: sql`${accountsTable.balanceInCents} + ${deltaInCents}` })
    .where(and(eq(accountsTable.id, account.id), eq(accountsTable.userId, userId)))
}
