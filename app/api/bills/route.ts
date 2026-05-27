import { ok, err } from '@/lib/api-response'
import { getBills, getSubscriptions } from '@/lib/data/store'
import type { BillsSummary } from '@/contracts/api-contracts'

export async function GET() {
  try {
    const [billList, subList] = await Promise.all([getBills(), getSubscriptions()])

    // --- Totals (integer math only) ---
    const totalDueNext30DaysInCents = billList.reduce(
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
      totalDueNext30DaysInCents,
      totalSubsMonthlyInCents,
      totalSubsAnnualInCents,
      bills: billList,
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
