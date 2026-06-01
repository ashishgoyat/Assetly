import { ok, err } from '@/lib/api-response'
import { getGoals, getTransactions } from '@/lib/data/store'
import { auth } from '@/auth'
import {
  computeGoalPercentage,
  getLatestTransactionDate,
  parseDate,
  computeSavingsRate,
  computeSavingsRateDelta,
} from '@/lib/calculations'
import type { GoalSummary } from '@/contracts/api-contracts'

export async function GET() {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const [goalList, txList] = await Promise.all([getGoals(userId), getTransactions(userId)])

    // --- Reference date: latest transaction date (fall back to today) ---
    const latestDate =
      getLatestTransactionDate(txList) || new Date().toISOString().slice(0, 10)
    const { year, month } = parseDate(latestDate)

    // --- Aggregate totals (integer math only) ---
    const totalSavedInCents = goalList.reduce(
      (sum, g) => sum + g.currentInCents,
      0,
    )
    const totalTargetInCents = goalList.reduce(
      (sum, g) => sum + g.targetInCents,
      0,
    )
    const totalMonthlyContributionInCents = goalList.reduce(
      (sum, g) => sum + g.monthlyContributionInCents,
      0,
    )

    // Savings rate computed from actual transaction data
    const savingsRatePercent = computeSavingsRate(txList, year, month)
    const savingsRateDeltaPoints = computeSavingsRateDelta(txList, year, month)

    // Active auto-transfer goals
    const activeTransfers = goalList.length

    // --- Enrich each goal with computed percentage ---
    const goals = goalList.map((g) => ({
      ...g,
      percentageComplete: computeGoalPercentage(
        g.currentInCents,
        g.targetInCents,
      ),
    }))

    const summary: GoalSummary = {
      totalSavedInCents,
      totalTargetInCents,
      totalMonthlyContributionInCents,
      savingsRatePercent,
      savingsRateDeltaPoints,
      activeTransfers,
      goals,
    }

    return ok(summary)
  } catch (error) {
    console.error('[GET /api/goals]', error)
    return err('Failed to load goals', 'GOALS_ERROR', 500)
  }
}
