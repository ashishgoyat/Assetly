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
  daysRemainingInMonth,
  formatDateLong,
  computeNetMonthlyInCents,
} from '@/lib/calculations'
import type { DashboardSummary } from '@/contracts/api-contracts'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    const userName = session?.user?.name ?? 'You'
    const userInitials = userName
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const [txList, acctList, billList, goalList, budgetList] = await Promise.all([
      getTransactions(),
      getAccounts(),
      getBills(),
      getGoals(),
      getBudgets(),
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

    // --- Actions (dynamically derived) ---
    const actions: DashboardSummary['actions'] = []

    // 1. Most urgent bill (smallest dueInDays)
    const urgentBill = [...billList].sort((a, b) => a.dueInDays - b.dueInDays)[0]
    if (urgentBill) {
      const dollars = (urgentBill.amountInCents / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      })
      actions.push({
        type: 'bill',
        title: `${urgentBill.name} — ${dollars}`,
        sub: `Due in ${urgentBill.dueInDays} day${urgentBill.dueInDays === 1 ? '' : 's'}${urgentBill.isAutoPay ? ' · Auto-pay ✓' : ''}`,
        cta: 'Review',
        tone: urgentBill.isUrgent ? 'warn' : 'accent',
        route: '/dashboard/bills',
      })
    }

    // 2. Most over-budget category (highest percentageUsed)
    const topBudget = [...budgetList].sort(
      (a, b) => b.percentageUsed - a.percentageUsed,
    )[0]
    if (topBudget && topBudget.percentageUsed >= 50) {
      const daysLeft = daysRemainingInMonth(year, month, day)
      actions.push({
        type: 'insight',
        title: `${topBudget.percentageUsed}% of ${topBudget.name} used`,
        sub: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in the month`,
        cta: 'See spending',
        tone: topBudget.isOver ? 'warn' : 'primary',
        route: '/dashboard/budgets',
      })
    }

    // 3. Pending transactions (if any)
    const pendingCount = txList.filter((tx) => tx.status === 'pending').length
    if (pendingCount > 0) {
      actions.push({
        type: 'todo',
        title: `${pendingCount} pending transaction${pendingCount === 1 ? '' : 's'}`,
        sub: 'Tap to review',
        cta: 'Review',
        tone: 'primary',
        route: '/dashboard/transactions',
      })
    }

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
      },
      netWorth: {
        totalInCents: netWorthCalc.totalInCents,
        monthDeltaInCents,
        totalAssetsInCents: netWorthCalc.totalAssetsInCents,
        totalLiabilitiesInCents: netWorthCalc.totalLiabilitiesInCents,
      },
      actions,
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
