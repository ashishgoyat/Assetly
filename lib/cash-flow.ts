/**
 * Cash flow calculation helpers.
 * Extracted from app/api/dashboard/route.ts so they can be reused by any route
 * that needs period-based balance history (e.g. account detail).
 *
 * All monetary values are in cents (smallest USD unit).
 */

import type { Transaction } from '@/contracts/api-contracts'

export type CashFlowPeriod = '1W' | '1M' | '3M' | '1Y'

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function signedAmount(tx: { type: string; amountInCents: number }): number {
  // Income adds to cash balance; expense subtracts.
  // For a backward walk: balanceBeforeTx = balanceAfterTx − signed(tx)
  return tx.type === 'income' ? tx.amountInCents : -tx.amountInCents
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

export function weekdayLabel(d: Date): string {
  return WEEKDAY_SHORT[d.getDay()]
}

export function monthDayLabel(d: Date): string {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}

export function monthLabel(d: Date): string {
  return MONTH_SHORT[d.getMonth()]
}

/**
 * Build a "balance at end of day" history.
 * Returns an array of length `numDays` where index 0 is `numDays-1` days ago
 * and the last index is today. The last value equals `currentTotal`.
 *
 * Walks transactions backwards: balanceBeforeDay = balanceAfterDay − signedDelta(transactions on day)
 */
export function buildDailyBalanceHistory(
  transactions: Transaction[],
  currentTotal: number,
  numDays: number,
  today: Date,
): number[] {
  // Pre-sum signed transaction deltas by ISO date key (YYYY-MM-DD).
  const deltaByDate = new Map<string, number>()
  for (const tx of transactions) {
    const key = tx.date
    deltaByDate.set(key, (deltaByDate.get(key) ?? 0) + signedAmount(tx))
  }

  const todayStart = startOfDay(today)
  // points[i] = balance at end of day `today - (numDays - 1 - i)`
  const points = new Array<number>(numDays)
  points[numDays - 1] = currentTotal

  // Any transactions occurring AFTER today's date roll back into pre-today balance.
  // We treat "today" as inclusive: end-of-today balance is currentTotal.
  let balance = currentTotal
  for (let i = numDays - 2; i >= 0; i--) {
    // Going from day (i+1) to day i: subtract deltas that happened ON day (i+1).
    // The day that just left "the future" is `today - (numDays - 1 - (i + 1)) = today - (numDays - 2 - i)`.
    const daysAgo = numDays - 2 - i
    const dayInQuestion = addDays(todayStart, -daysAgo)
    const key = `${dayInQuestion.getFullYear()}-${String(dayInQuestion.getMonth() + 1).padStart(2, '0')}-${String(dayInQuestion.getDate()).padStart(2, '0')}`
    const dayDelta = deltaByDate.get(key) ?? 0
    balance = balance - dayDelta
    points[i] = balance
  }

  return points
}

/**
 * Sample weekly points from a daily history (one point per week, newest = today).
 */
export function sampleWeekly(daily: number[], numWeeks: number): number[] {
  // daily index 0 = oldest, last = today.
  const result = new Array<number>(numWeeks)
  for (let i = 0; i < numWeeks; i++) {
    // newest week is i = numWeeks - 1, sample at "today - 0 days"
    // oldest week is i = 0, sample at "today - (numWeeks - 1) * 7 days"
    const daysAgo = (numWeeks - 1 - i) * 7
    const dailyIndex = daily.length - 1 - daysAgo
    result[i] = daily[Math.max(0, dailyIndex)] ?? daily[0] ?? 0
  }
  return result
}

/**
 * Sample monthly points from a daily history.
 * Newest = today, sampled every ~30 days backwards.
 */
export function sampleMonthly(daily: number[], numMonths: number): number[] {
  const result = new Array<number>(numMonths)
  for (let i = 0; i < numMonths; i++) {
    const daysAgo = (numMonths - 1 - i) * 30
    const dailyIndex = daily.length - 1 - daysAgo
    result[i] = daily[Math.max(0, dailyIndex)] ?? daily[0] ?? 0
  }
  return result
}

/**
 * Compute the cash flow chart data + axis labels for every period.
 * Periods:
 *   1W → 7 daily points, weekday labels ('Mon'..'Today')
 *   1M → 30 daily points, 5 sparse labels ('MMM D'..'Today')
 *   3M → 13 weekly points, 5 sparse labels (month + 'Today')
 *   1Y → 12 monthly points, 6 labels (every other month + 'Today')
 *
 * Note: data array length and labels array length differ on purpose.
 */
export function computeCashFlow(
  transactions: Transaction[],
  currentTotal: number,
  today: Date,
): {
  dataByPeriod: Record<CashFlowPeriod, number[]>
  labelsByPeriod: Record<CashFlowPeriod, string[]>
} {
  // Build a generous daily history (1Y ≈ 360 days) once, then sample.
  const yearDays = 12 * 30 // 360 — covers 1Y monthly sampling
  const dailyHistoryYear = buildDailyBalanceHistory(
    transactions,
    currentTotal,
    yearDays,
    today,
  )

  // 1W: last 7 daily points (slice from the yearly daily history).
  const week = dailyHistoryYear.slice(-7)
  // 1M: last 30 daily points.
  const month = dailyHistoryYear.slice(-30)
  // 3M: 13 weekly points sampled from daily.
  const threeMonth = sampleWeekly(dailyHistoryYear, 13)
  // 1Y: 12 monthly points sampled from daily.
  const year = sampleMonthly(dailyHistoryYear, 12)

  const todayStart = startOfDay(today)

  // 1W labels: 7 weekday short, last = 'Today'.
  const weekLabels: string[] = []
  for (let i = 6; i >= 0; i--) {
    weekLabels.push(i === 0 ? 'Today' : weekdayLabel(addDays(todayStart, -i)))
  }

  // 1M labels: 5 evenly spaced 'MMM D' across the 30-day window, last = 'Today'.
  // Indices in a 30-point series: 0, 7, 14, 21, 29
  const monthLabelIndices = [0, 7, 14, 21, 29]
  const monthLabels = monthLabelIndices.map((idx) => {
    if (idx === 29) return 'Today'
    const daysAgo = 29 - idx
    return monthDayLabel(addDays(todayStart, -daysAgo))
  })

  // 3M labels: 5 labels (4 months + 'Today').
  // 13 weekly points span ~12 weeks ≈ 84 days back. Sample at weeks 0, 3, 6, 9, 12.
  const threeMonthLabelWeeks = [0, 3, 6, 9, 12]
  const threeMonthLabels = threeMonthLabelWeeks.map((wk) => {
    if (wk === 12) return 'Today'
    const daysAgo = (12 - wk) * 7
    return monthLabel(addDays(todayStart, -daysAgo))
  })

  // 1Y labels: 6 entries — every other month, last = 'Today'.
  // 12 monthly points. Indices: 0, 2, 4, 6, 8, 11 (skip 10 to land on 'Today').
  const yearLabelIndices = [0, 2, 4, 6, 8, 11]
  const yearLabels = yearLabelIndices.map((idx) => {
    if (idx === 11) return 'Today'
    const daysAgo = (11 - idx) * 30
    return monthLabel(addDays(todayStart, -daysAgo))
  })

  return {
    dataByPeriod: {
      '1W': week,
      '1M': month,
      '3M': threeMonth,
      '1Y': year,
    },
    labelsByPeriod: {
      '1W': weekLabels,
      '1M': monthLabels,
      '3M': threeMonthLabels,
      '1Y': yearLabels,
    },
  }
}
