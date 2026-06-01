import { ok, err } from '@/lib/api-response'
import {
  getTransactions,
  getAccounts,
  getBills,
  getGoals,
  getBudgets,
  cashFlowData,
} from '@/lib/data/store'
import {
  computeNetWorth,
  computeCategoryPercentages,
  getLatestTransactionDate,
  parseDate,
  daysInMonth,
  formatDateLong,
  computeNetMonthlyInCents,
} from '@/lib/calculations'
import type { DashboardSummary, Transaction } from '@/contracts/api-contracts'
import { auth } from '@/auth'

// ---------------------------------------------------------------------------
// Cash flow helpers
// ---------------------------------------------------------------------------

type CashFlowPeriod = '1W' | '1M' | '3M' | '1Y'

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function signedAmount(tx: { type: string; amountInCents: number }): number {
  // Income added to cash, expense subtracted. For a backward walk:
  // balanceBeforeTx = balanceAfterTx − signed(tx)
  return tx.type === 'income' ? tx.amountInCents : -tx.amountInCents
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

function weekdayLabel(d: Date): string {
  return WEEKDAY_SHORT[d.getDay()]
}

function monthDayLabel(d: Date): string {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}

function monthLabel(d: Date): string {
  return MONTH_SHORT[d.getMonth()]
}

/**
 * Build a "balance at end of day" history.
 * Returns an array of length `numDays` where index 0 is `numDays-1` days ago
 * and the last index is today. The last value equals `currentTotal`.
 *
 * Walks transactions backwards: balanceBeforeDay = balanceAfterDay − signedDelta(transactions on day)
 */
function buildDailyBalanceHistory(
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
function sampleWeekly(daily: number[], numWeeks: number): number[] {
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
function sampleMonthly(daily: number[], numMonths: number): number[] {
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
function computeCashFlow(
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

export async function GET() {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    const userName = session?.user?.name ?? 'You'
    const userInitials = userName
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const [txList, acctList, billList, goalList, budgetList] = await Promise.all([
      getTransactions(userId),
      getAccounts(userId),
      getBills(userId),
      getGoals(userId),
      getBudgets(userId),
    ])

    // --- Reference date: latest transaction date (fall back to today) ---
    const latestDate =
      getLatestTransactionDate(txList) || new Date().toISOString().slice(0, 10)
    const { year, month, day } = parseDate(latestDate)

    // --- Net worth (server-side) ---
    const netWorthCalc = computeNetWorth(acctList)

    // --- Cash on hand: sum of non-investment account balances ---
    const cashAccounts = acctList.filter((a) => a.type !== 'investment')
    const cashTotalInCents = cashAccounts.reduce(
      (sum, a) => sum + a.balanceInCents,
      0,
    )
    const cashWeekDeltaInCents = cashAccounts.reduce(
      (sum, a) => sum + a.weekDeltaInCents,
      0,
    )

    // --- Cash flow chart data + labels (server-computed from real transactions) ---
    const { dataByPeriod: cashFlowDataByPeriod, labelsByPeriod: cashFlowLabelsByPeriod } =
      computeCashFlow(txList, cashTotalInCents, new Date())

    // --- Today stats (computed from DB) ---
    const spentTodayInCents = txList
      .filter((tx) => tx.date === latestDate && tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amountInCents, 0)

    const totalBudgetLimitInCents = budgetList.reduce(
      (sum, b) => sum + b.limitInCents,
      0,
    )
    const daysInCurrentMonth = daysInMonth(year, month)
    const dailyAllowanceInCents = Math.round(
      totalBudgetLimitInCents / daysInCurrentMonth,
    )
    const safeToSpendInCents = Math.max(
      0,
      dailyAllowanceInCents - spentTodayInCents,
    )
    const percentSpentToday =
      dailyAllowanceInCents > 0
        ? Math.round((spentTodayInCents / dailyAllowanceInCents) * 100)
        : 0

    // --- Recent transactions: last 7 ---
    const recentTransactions = txList.slice(0, 7)

    // --- Upcoming bills: next 4 sorted by dueInDays ---
    const upcomingBills = [...billList]
      .sort((a, b) => a.dueInDays - b.dueInDays)
      .slice(0, 4)

    // --- Saving goals: first 3 ---
    const savingGoals = goalList.slice(0, 3)

    // --- Net worth month delta from transactions ---
    const monthDeltaInCents = computeNetMonthlyInCents(txList, year, month)

    // --- Spending categories: built from budget spentInCents (full-month, consistent with budget page) ---
    const rawCategories = budgetList
      .filter((b) => b.spentInCents > 0)
      .map((b) => ({ name: b.name, amountInCents: b.spentInCents, color: b.color }))
    const spendingCategories = computeCategoryPercentages(rawCategories)
    const totalSpentThisMonthInCents = rawCategories.reduce(
      (sum, c) => sum + c.amountInCents,
      0,
    )

    const summary: DashboardSummary = {
      user: {
        name: userName,
        initials: userInitials,
        lastSync: '2 min ago',
      },
      today: {
        date: formatDateLong(latestDate),
        safeToSpendInCents,
        dailyAllowanceInCents,
        spentTodayInCents,
        percentSpentToday,
      },
      cashOnHand: {
        totalInCents: cashTotalInCents,
        weekDeltaInCents: cashWeekDeltaInCents,
        cashFlowData,
        cashFlowDataByPeriod,
        cashFlowLabelsByPeriod,
      },
      netWorth: {
        totalInCents: netWorthCalc.totalInCents,
        monthDeltaInCents,
        totalAssetsInCents: netWorthCalc.totalAssetsInCents,
        totalLiabilitiesInCents: netWorthCalc.totalLiabilitiesInCents,
      },
      recentTransactions,
      upcomingBills,
      savingGoals,
      spendingCategories,
      totalSpentThisMonthInCents,
    }

    return ok(summary)
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return err('Failed to load dashboard data', 'DASHBOARD_ERROR', 500)
  }
}
