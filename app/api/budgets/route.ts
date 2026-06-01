import { type NextRequest } from 'next/server'
import { ok, err } from '@/lib/api-response'
import { getBudgets, getTransactions } from '@/lib/data/store'
import { auth } from '@/auth'
import {
  computeBudgetPercentage,
  getLatestTransactionDate,
  parseDate,
  daysInMonth,
  daysRemainingInMonth,
  formatMonthLabel,
  computeDailySpendTotals,
} from '@/lib/calculations'
import type { BudgetSummary } from '@/contracts/api-contracts'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const [budgetList, txList] = await Promise.all([getBudgets(userId), getTransactions(userId)])

    // --- Determine reference month ---
    const { searchParams } = req.nextUrl
    const monthParam = searchParams.get('month') // "2026-04" or null

    let year: number
    let month: number
    let numDays: number
    let referenceDate: string
    let daysLeft: number

    const isValidMonthParam = monthParam !== null && /^\d{4}-\d{2}$/.test(monthParam)

    if (isValidMonthParam) {
      // Client-requested month
      const parts = monthParam.split('-')
      year = Number(parts[0])
      month = Number(parts[1])
      numDays = daysInMonth(year, month)
      const dd = String(numDays).padStart(2, '0')
      const mm = String(month).padStart(2, '0')
      referenceDate = `${year}-${mm}-${dd}`

      // Compute daysLeft relative to today
      const today = new Date()
      const todayYear = today.getFullYear()
      const todayMonth = today.getMonth() + 1 // 1-indexed
      const todayDay = today.getDate()

      if (year > todayYear || (year === todayYear && month > todayMonth)) {
        // Future month
        daysLeft = numDays
      } else if (year < todayYear || (year === todayYear && month < todayMonth)) {
        // Past month
        daysLeft = 0
      } else {
        // Current month
        daysLeft = daysRemainingInMonth(year, month, todayDay)
      }
    } else {
      // Default: use latest transaction date (fall back to today)
      const latestDate =
        getLatestTransactionDate(txList) || new Date().toISOString().slice(0, 10)
      const parsed = parseDate(latestDate)
      year = parsed.year
      month = parsed.month
      const day = parsed.day
      numDays = daysInMonth(year, month)
      referenceDate = latestDate
      daysLeft = daysRemainingInMonth(year, month, day)
    }

    const monthLabel = formatMonthLabel(referenceDate)

    // --- Compute per-category spend from real transactions (integer math only) ---
    // Only expense transactions from the selected month count.
    const mmStr = String(month).padStart(2, '0')
    const monthPrefix = `${year}-${mmStr}`
    const spentByCategory = new Map<string, number>()
    for (const tx of txList) {
      if (tx.type !== 'expense') continue
      if (!tx.date.startsWith(monthPrefix)) continue
      spentByCategory.set(
        tx.category,
        (spentByCategory.get(tx.category) ?? 0) + tx.amountInCents,
      )
    }

    // --- Enrich each budget with computed fields driven by real transactions ---
    const budgets = budgetList.map((b) => {
      const spentInCents = spentByCategory.get(b.category) ?? 0
      return {
        ...b,
        spentInCents,
        percentageUsed: computeBudgetPercentage(spentInCents, b.limitInCents),
        isOver: spentInCents > b.limitInCents,
      }
    })

    // --- Aggregate totals (integer math only) — use the computed per-budget values ---
    const totalSpentInCents = budgets.reduce(
      (sum, b) => sum + b.spentInCents,
      0,
    )
    const totalLimitInCents = budgets.reduce(
      (sum, b) => sum + b.limitInCents,
      0,
    )
    const remainingInCents = totalLimitInCents - totalSpentInCents
    const percentageUsed = computeBudgetPercentage(
      totalSpentInCents,
      totalLimitInCents,
    )

    // Daily limit going forward: remaining / days left (integer, rounded)
    const dailyLimitGoingForwardInCents =
      daysLeft > 0 ? Math.round(remainingInCents / daysLeft) : 0

    // --- Real daily spend heatmap: one entry per calendar day of the selected month ---
    const dailySpendHistory = computeDailySpendTotals(txList, referenceDate, numDays)

    // --- vs last month: no prior-month transactions in DB, return empty ---
    const vsLastMonth: BudgetSummary['vsLastMonth'] = []

    const summary: BudgetSummary = {
      month: monthLabel,
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
