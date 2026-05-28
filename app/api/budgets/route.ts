import { ok, err } from '@/lib/api-response'
import { getBudgets, getTransactions } from '@/lib/data/store'
import {
  computeBudgetPercentage,
  getLatestTransactionDate,
  parseDate,
  daysRemainingInMonth,
  formatMonthLabel,
  computeDailySpendTotals,
} from '@/lib/calculations'
import type { BudgetSummary } from '@/contracts/api-contracts'

export async function GET() {
  try {
    const [budgetList, txList] = await Promise.all([getBudgets(), getTransactions()])

    // --- Reference date: latest transaction date (fall back to today) ---
    const latestDate =
      getLatestTransactionDate(txList) || new Date().toISOString().slice(0, 10)
    const { year, month, day } = parseDate(latestDate)

    // --- Aggregate totals (integer math only) ---
    const totalSpentInCents = budgetList.reduce(
      (sum, b) => sum + b.spentInCents,
      0,
    )
    const totalLimitInCents = budgetList.reduce(
      (sum, b) => sum + b.limitInCents,
      0,
    )
    const remainingInCents = totalLimitInCents - totalSpentInCents
    const percentageUsed = computeBudgetPercentage(
      totalSpentInCents,
      totalLimitInCents,
    )

    const daysLeft = daysRemainingInMonth(year, month, day)
    const monthLabel = formatMonthLabel(latestDate)

    // Daily limit going forward: remaining / days left (integer, rounded)
    const dailyLimitGoingForwardInCents =
      daysLeft > 0 ? Math.round(remainingInCents / daysLeft) : 0

    // --- Enrich each budget with computed fields ---
    const budgets = budgetList.map((b) => ({
      ...b,
      percentageUsed: computeBudgetPercentage(b.spentInCents, b.limitInCents),
      isOver: b.spentInCents > b.limitInCents,
    }))

    // --- Real daily spend heatmap (30 values in cents, one per day) ---
    const dailySpendHistory = computeDailySpendTotals(txList, latestDate, 30)

    // --- vs last month: no prior-month transactions in DB, return empty ---
    const vsLastMonth: BudgetSummary['vsLastMonth'] = []

    const summary: BudgetSummary = {
      month: monthLabel,
      daysLeft,
      totalSpentInCents,
      totalLimitInCents,
      percentageUsed,
      remainingInCents,
      dailyLimitGoingForwardInCents,
      budgets,
      dailySpendHistory,
      vsLastMonth,
    }

    return ok(summary)
  } catch (error) {
    console.error('[GET /api/budgets]', error)
    return err('Failed to load budgets', 'BUDGETS_ERROR', 500)
  }
}
