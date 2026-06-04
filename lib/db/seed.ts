/**
 * Database seed — inserts initial data from lib/data/seed-data.ts.
 * Idempotent: each table is checked for row count before inserting.
 * Safe to call multiple times; will not duplicate rows.
 */

import { db } from './index'
import {
  transactionsTable,
  accountsTable,
  budgetsTable,
  goalsTable,
  billsTable,
  subscriptionsTable,
  insightsTable,
} from './schema'
import { sql } from 'drizzle-orm'
import {
  transactions as seedTransactions,
  accounts as seedAccounts,
  budgets as seedBudgets,
  goals as seedGoals,
  bills as seedBills,
  subscriptions as seedSubscriptions,
  insights as seedInsights,
} from '@/lib/data/seed-data'

// ---------------------------------------------------------------------------
// Helper — async row count via Drizzle
// ---------------------------------------------------------------------------

async function isEmpty(tableName: string): Promise<boolean> {
  const result = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*) AS count FROM ${sql.identifier(tableName)}`,
  )
  return Number(result[0]?.count ?? 0) === 0
}

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

export async function runSeed(): Promise<void> {
  // Transactions
  if (await isEmpty('transactions')) {
    await db.insert(transactionsTable).values(
      seedTransactions.map((t) => ({
        id: t.id,
        date: t.date,
        time: t.time,
        merchant: t.merchant,
        category: t.category,
        accountLabel: t.accountLabel,
        amountInCents: t.amountInCents,
        type: t.type,
        status: t.status,
        note: t.note ?? null,
      })),
    )
  }

  // Accounts
  if (await isEmpty('accounts')) {
    await db.insert(accountsTable).values(
      seedAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        number: a.number,
        balanceInCents: a.balanceInCents,
        weekDeltaInCents: a.weekDeltaInCents,
        type: a.type,
        color: a.color,
        apyBps: a.apyBps ?? null,
        routingNumber: a.routingNumber ?? null,
        linkedSince: a.linkedSince,
        lastSync: a.lastSync,
        balanceHistory: JSON.stringify(a.balanceHistory),
      })),
    )
  }

  // Budgets
  if (await isEmpty('budgets')) {
    await db.insert(budgetsTable).values(
      seedBudgets.map((b) => ({
        id: b.id,
        name: b.name,
        category: b.category,
        limitInCents: b.limitInCents,
        spentInCents: b.spentInCents,
        percentageUsed: b.percentageUsed,
        icon: b.icon,
        color: b.color,
        isOver: b.isOver,
      })),
    )
  }

  // Goals
  if (await isEmpty('goals')) {
    await db.insert(goalsTable).values(
      seedGoals.map((g) => ({
        id: g.id,
        name: g.name,
        currentInCents: g.currentInCents,
        targetInCents: g.targetInCents,
        monthlyContributionInCents: g.monthlyContributionInCents,
        percentageComplete: g.percentageComplete,
        eta: g.eta,
        icon: g.icon,
        color: g.color,
        vibe: g.vibe,
      })),
    )
  }

  // Bills
  if (await isEmpty('bills')) {
    await db.insert(billsTable).values(
      seedBills.map((b) => ({
        id: b.id,
        name: b.name,
        amountInCents: b.amountInCents,
        dueDate: b.dueDate,
        dueInDays: b.dueInDays,
        isAutoPay: b.isAutoPay,
        isUrgent: b.isUrgent,
        category: b.category,
        icon: b.icon,
        color: b.color,
      })),
    )
  }

  // Subscriptions
  if (await isEmpty('subscriptions')) {
    await db.insert(subscriptionsTable).values(
      seedSubscriptions.map((s) => ({
        id: s.id,
        name: s.name,
        amountMonthlyInCents: s.amountMonthlyInCents,
        nextDate: s.nextDate,
        isUsed: s.isUsed,
        icon: s.icon,
        color: s.color,
      })),
    )
  }

  // Insights
  if (await isEmpty('insights')) {
    await db.insert(insightsTable).values(
      seedInsights.map((i) => ({
        id: i.id,
        glyph: i.glyph,
        tag: i.tag,
        tone: i.tone,
        title: i.title,
        body: i.body,
        cta: i.cta,
        isPinned: i.isPinned,
        sparklineData: i.sparklineData != null ? JSON.stringify(i.sparklineData) : null,
      })),
    )
  }
}
