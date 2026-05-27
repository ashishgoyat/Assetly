/**
 * Server-side financial calculation utilities.
 * All values operate on cents (smallest USD unit).
 * Never use float arithmetic — integers only.
 */

import type { Account } from '@/contracts/api-contracts'

// ---------------------------------------------------------------------------
// Net worth
// ---------------------------------------------------------------------------

export function computeNetWorth(accts: Account[]): {
  totalInCents: number
  totalAssetsInCents: number
  totalLiabilitiesInCents: number
} {
  // For now all accounts are assets. Liabilities will be introduced with a
  // dedicated liability account type in a future iteration.
  const totalAssetsInCents = accts.reduce((sum, a) => sum + a.balanceInCents, 0)
  const totalLiabilitiesInCents = 0
  return {
    totalInCents: totalAssetsInCents - totalLiabilitiesInCents,
    totalAssetsInCents,
    totalLiabilitiesInCents,
  }
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

/** Returns 0–100+ (over-budget can exceed 100). */
export function computeBudgetPercentage(
  spentInCents: number,
  limitInCents: number,
): number {
  if (limitInCents === 0) return 0
  return Math.round((spentInCents / limitInCents) * 100)
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

/** Returns 0–100 clamped percentage. */
export function computeGoalPercentage(
  currentInCents: number,
  targetInCents: number,
): number {
  if (targetInCents === 0) return 0
  return Math.round((currentInCents / targetInCents) * 100)
}

// ---------------------------------------------------------------------------
// Category spending percentages (must sum to 100)
// ---------------------------------------------------------------------------

export function computeCategoryPercentages<T extends { amountInCents: number }>(
  categories: T[],
): Array<T & { percentage: number }> {
  const total = categories.reduce((sum, c) => sum + c.amountInCents, 0)

  if (total === 0) {
    return categories.map((c) => ({ ...c, percentage: 0 }))
  }

  const withPcts = categories.map((c) => ({
    ...c,
    percentage: Math.round((c.amountInCents / total) * 100),
  }))

  // Adjust the largest slice to absorb any rounding discrepancy
  const sum = withPcts.reduce((s, c) => s + c.percentage, 0)
  if (sum !== 100 && withPcts.length > 0) {
    const largestIdx = withPcts.reduce(
      (maxIdx, c, i, arr) =>
        c.percentage > arr[maxIdx].percentage ? i : maxIdx,
      0,
    )
    withPcts[largestIdx].percentage += 100 - sum
  }

  return withPcts
}

// ---------------------------------------------------------------------------
// Daily spend history (deterministic pseudo-data for heatmap)
// ---------------------------------------------------------------------------

/**
 * Generates 30 daily spend values in cents using a deterministic formula.
 * These are illustrative until real per-day transaction aggregates are wired.
 */
export function generateDailySpendHistory(): number[] {
  return Array.from({ length: 30 }, (_, i) => {
    // Deterministic but varied: produces values between ~1500 and ~9500 cents
    const intensity = ((i * 37 + 13) % 100) / 100
    return Math.round(intensity * 8000 + 1500)
  })
}
