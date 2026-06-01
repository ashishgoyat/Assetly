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
import { computeCashFlow } from '@/lib/cash-flow'
import type { DashboardSummary } from '@/contracts/api-contracts'
import { auth } from '@/auth'

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
