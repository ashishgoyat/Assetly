/**
 * Server-side financial calculation utilities.
 * All values operate on cents (smallest USD unit).
 * Never use float arithmetic — integers only.
 */

import type { Account, Transaction } from '@/contracts/api-contracts'

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Parses an ISO date string "YYYY-MM-DD" into its component parts. */
export function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-')
  return {
    year: Number(parts[0]),
    month: Number(parts[1]),
    day: Number(parts[2]),
  }
}

/** Returns the number of days in a given year and month (1-indexed). */
export function daysInMonth(year: number, month: number): number {
  // Day 0 of next month = last day of current month
  return new Date(year, month, 0).getDate()
}

/** Returns days remaining from `day` to end of month (inclusive of today means remaining = total - day). */
export function daysRemainingInMonth(year: number, month: number, day: number): number {
  return daysInMonth(year, month) - day
}

/** Formats "2026-04-23" → "Thursday, April 23" */
export function formatDateLong(dateStr: string): string {
  const { year, month, day } = parseDate(dateStr)
  const d = new Date(year, month - 1, day)
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
  const monthName = d.toLocaleDateString('en-US', { month: 'long' })
  return `${weekday}, ${monthName} ${day}`
}

/** Formats "2026-04-23" → "April 2026" */
export function formatMonthLabel(dateStr: string): string {
  const { year, month, day } = parseDate(dateStr)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Returns the latest ISO date string ("YYYY-MM-DD") across all transactions. Returns '' if empty. */
export function getLatestTransactionDate(txs: Transaction[]): string {
  if (txs.length === 0) return ''
  // Dates are ISO strings — lexicographic max is the latest
  return txs.reduce((latest, tx) => (tx.date > latest ? tx.date : latest), txs[0].date)
}

/**
 * Returns real daily expense totals in cents for `days` days ending on `latestDate` (most recent last).
 * Missing days are filled with 0. Array length equals `days`.
 */
export function computeDailySpendTotals(
  txs: Transaction[],
  latestDate: string,
  days = 30,
): number[] {
  // Build a map of date → total expense in cents
  const byDate = new Map<string, number>()
  for (const tx of txs) {
    if (tx.type !== 'expense') continue
    byDate.set(tx.date, (byDate.get(tx.date) ?? 0) + tx.amountInCents)
  }

  // Generate the `days` date strings ending on latestDate
  const { year, month, day } = parseDate(latestDate)
  const endMs = new Date(year, month - 1, day).getTime()
  const msPerDay = 86_400_000

  const result: number[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endMs - i * msPerDay)
    // Format as YYYY-MM-DD using local time parts
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const key = `${yyyy}-${mm}-${dd}`
    result.push(byDate.get(key) ?? 0)
  }

  return result
}

/** Returns net monthly flow (income - expenses) in cents for the given year/month. */
export function computeNetMonthlyInCents(
  txs: Transaction[],
  year: number,
  month: number,
): number {
  const mmStr = String(month).padStart(2, '0')
  const prefix = `${year}-${mmStr}`
  let income = 0
  let expenses = 0
  for (const tx of txs) {
    if (!tx.date.startsWith(prefix)) continue
    if (tx.type === 'income') income += tx.amountInCents
    else if (tx.type === 'expense') expenses += tx.amountInCents
  }
  return income - expenses
}

/**
 * Savings rate as an integer 0–100 for the given year/month.
 * Formula: Math.round((income - expenses) / income * 100)
 * Returns 0 if no income.
 */
export function computeSavingsRate(
  txs: Transaction[],
  year: number,
  month: number,
): number {
  const mmStr = String(month).padStart(2, '0')
  const prefix = `${year}-${mmStr}`
  let income = 0
  let expenses = 0
  for (const tx of txs) {
    if (!tx.date.startsWith(prefix)) continue
    if (tx.type === 'income') income += tx.amountInCents
    else if (tx.type === 'expense') expenses += tx.amountInCents
  }
  if (income === 0) return 0
  return Math.round(((income - expenses) / income) * 100)
}

/**
 * Savings rate delta vs previous month in percentage points (current - previous).
 * Returns 0 if either month has no income.
 */
export function computeSavingsRateDelta(
  txs: Transaction[],
  year: number,
  month: number,
): number {
  const current = computeSavingsRate(txs, year, month)

  // Previous month
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const previous = computeSavingsRate(txs, prevYear, prevMonth)

  // If previous month had no data, both rates would be 0; still return 0
  return current - previous
}

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
