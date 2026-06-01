import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/api-response'
import { getBills, getSubscriptions } from '@/lib/data/store'
import type { BillsSummary } from '@/contracts/api-contracts'
import { auth } from '@/auth'

const VALID_PERIODS = [30, 60, 90] as const
type PeriodDays = (typeof VALID_PERIODS)[number]

function parsePeriodDays(raw: string | null): PeriodDays {
  const n = parseInt(raw ?? '30', 10)
  return (VALID_PERIODS as readonly number[]).includes(n) ? (n as PeriodDays) : 30
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const days = parsePeriodDays(request.nextUrl.searchParams.get('days'))

    const [billList, subList] = await Promise.all([getBills(userId), getSubscriptions(userId)])

    // Filter bills to only those due within the selected period
    const filteredBills = billList.filter((b) => b.dueInDays <= days)

    // --- Totals (integer math only) ---
    const totalDuePeriodInCents = filteredBills.reduce(
      (sum, b) => sum + b.amountInCents,
      0,
    )

    const totalSubsMonthlyInCents = subList.reduce(
      (sum, s) => sum + s.amountMonthlyInCents,
      0,
    )

    // Annual = monthly × 12 (integer math)
    const totalSubsAnnualInCents = totalSubsMonthlyInCents * 12

    // Savings opportunity = sum of unused subscription monthly amounts
    const unusedSubs = subList.filter((s) => !s.isUsed)
    const savingsOpportunityInCents = unusedSubs.reduce(
      (sum, s) => sum + s.amountMonthlyInCents,
      0,
    )
    const savingsOpportunityNote =
      unusedSubs.length > 0
        ? `Cancel ${unusedSubs.map((s) => s.name).join(' and ')} to save $${(savingsOpportunityInCents / 100).toFixed(2)}/mo`
        : undefined

    const summary: BillsSummary = {
      periodDays: days,
      totalDuePeriodInCents,
      totalSubsMonthlyInCents,
      totalSubsAnnualInCents,
      bills: filteredBills,
      subscriptions: subList,
      savingsOpportunityInCents,
      savingsOpportunityNote,
    }

    return ok(summary)
  } catch (error) {
    console.error('[GET /api/bills]', error)
    return err('Failed to load bills', 'BILLS_ERROR', 500)
  }
}
