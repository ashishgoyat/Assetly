import { ok, err } from '@/lib/api-response'
import {
  getTransactions,
  getAccounts,
  getBills,
  getGoals,
  cashFlowData,
} from '@/lib/data/store'
import { computeNetWorth, computeCategoryPercentages } from '@/lib/calculations'
import type { DashboardSummary } from '@/contracts/api-contracts'

export async function GET() {
  try {
    const [txList, acctList, billList, goalList] = await Promise.all([
      getTransactions(),
      getAccounts(),
      getBills(),
      getGoals(),
    ])

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

    // --- Today stats (seeded values in cents) ---
    const safeToSpendInCents = 7200 // $72
    const dailyAllowanceInCents = 9500 // $95
    const spentTodayInCents = 2300 // $23
    const percentSpentToday = Math.round(
      (spentTodayInCents / dailyAllowanceInCents) * 100,
    )

    // --- Recent transactions: last 7 ---
    const recentTransactions = txList.slice(0, 7)

    // --- Upcoming bills: next 4 sorted by dueInDays ---
    const upcomingBills = [...billList]
      .sort((a, b) => a.dueInDays - b.dueInDays)
      .slice(0, 4)

    // --- Saving goals: first 3 ---
    const savingGoals = goalList.slice(0, 3)

    // --- Spending categories with server-side percentages ---
    const rawCategories = [
      { name: 'Rent & utilities', amountInCents: 52000, color: 'var(--cat-1)' },
      { name: 'Groceries', amountInCents: 28000, color: 'var(--cat-2)' },
      { name: 'Dining', amountInCents: 22000, color: 'var(--cat-3)' },
      { name: 'Transport', amountInCents: 14000, color: 'var(--cat-4)' },
      { name: 'Other', amountInCents: 8700, color: 'var(--cat-5)' },
    ]
    const spendingCategories = computeCategoryPercentages(rawCategories)
    const totalSpentThisMonthInCents = rawCategories.reduce(
      (sum, c) => sum + c.amountInCents,
      0,
    )

    // --- Actions (static, derived from seeded data) ---
    const actions: DashboardSummary['actions'] = [
      {
        type: 'bill',
        title: 'Rent — $1,400',
        sub: 'Due in 2 days · Auto-pay from Chase ✓',
        cta: 'Review',
        tone: 'accent',
        route: '/bills',
      },
      {
        type: 'insight',
        title: '82% of dining used',
        sub: '15 days left in the month',
        cta: 'See spending',
        tone: 'warn',
        route: '/budgets',
      },
      {
        type: 'todo',
        title: '3 to categorize',
        sub: 'Amazon, Uber, Spotify',
        cta: 'Categorize',
        tone: 'primary',
        route: '/transactions',
      },
    ]

    const summary: DashboardSummary = {
      user: {
        name: 'Maya',
        initials: 'M',
        lastSync: '2 min ago',
      },
      today: {
        date: 'Tuesday, April 23',
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
        monthDeltaInCents: 124000, // $1,240 seed value
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
