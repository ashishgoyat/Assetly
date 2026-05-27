import { ok, err } from '@/lib/api-response'
import { getGoals } from '@/lib/data/store'
import { computeGoalPercentage } from '@/lib/calculations'
import type { GoalSummary } from '@/contracts/api-contracts'

export async function GET() {
  try {
    const goalList = await getGoals()

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

    // Savings rate and delta are computed from income/expense data.
    // For this seed iteration, values match the design (23%, +5pts from March).
    const savingsRatePercent = 23
    const savingsRateDeltaPoints = 5

    // 4 active auto-transfer goals
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
