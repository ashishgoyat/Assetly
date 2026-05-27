import { ok, err } from '@/lib/api-response'
import { getBudgets } from '@/lib/data/store'
import {
  computeBudgetPercentage,
  generateDailySpendHistory,
} from '@/lib/calculations'
import type { BudgetSummary } from '@/contracts/api-contracts'

export async function GET() {
  try {
    const budgetList = await getBudgets()

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

    // April 2026: 7 days left in the month
    const daysLeft = 7
    // Daily limit going forward: remaining / days left (integer division, round)
    const dailyLimitGoingForwardInCents =
      daysLeft > 0 ? Math.round(remainingInCents / daysLeft) : 0

    // --- Enrich each budget with computed fields ---
    const budgets = budgetList.map((b) => ({
      ...b,
      percentageUsed: computeBudgetPercentage(b.spentInCents, b.limitInCents),
      isOver: b.spentInCents > b.limitInCents,
    }))

    // --- Deterministic daily spend heatmap (30 values in cents) ---
    const dailySpendHistory = generateDailySpendHistory()

    // --- vs last month deltas (in cents) ---
    // Negative = spent less (good), positive = spent more (bad)
    const vsLastMonth: BudgetSummary['vsLastMonth'] = [
      { category: 'Groceries', deltaInCents: -2000, tone: 'pos' }, // -$20
      { category: 'Dining', deltaInCents: 4500, tone: 'neg' }, // +$45
      { category: 'Transport', deltaInCents: -1000, tone: 'pos' }, // -$10
      { category: 'Shopping', deltaInCents: -3800, tone: 'pos' }, // -$38
    ]

    const summary: BudgetSummary = {
      month: 'April 2026',
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
