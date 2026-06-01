import { type NextRequest } from 'next/server'
import { ok, err } from '@/lib/api-response'
import { getAccountById, getTransactions } from '@/lib/data/store'
import { computeCashFlow } from '@/lib/cash-flow'
import type { AccountDetail } from '@/contracts/api-contracts'
import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string }> }

const VALID_PERIODS = ['1W', '1M', '3M', '1Y'] as const
type Period = (typeof VALID_PERIODS)[number]

function parsePeriod(raw: string | null): Period {
  if (raw !== null && (VALID_PERIODS as readonly string[]).includes(raw)) {
    return raw as Period
  }
  return '1M'
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const selectedPeriod = parsePeriod(req.nextUrl.searchParams.get('period'))

    const account = await getAccountById(id, userId)
    if (account === undefined) {
      return err(`Account '${id}' not found`, 'ACCOUNT_NOT_FOUND', 404)
    }

    const allTransactions = await getTransactions(userId)

    // Filter transactions that belong to this account by matching accountLabel
    const accountTransactions = allTransactions.filter((tx) =>
      tx.accountLabel.toLowerCase().includes(account.number.toLowerCase()),
    )

    // Recent transactions for this account (up to 10, all time, unaffected by period)
    const recentTransactions = accountTransactions.slice(0, 10)

    // Monthly summary (all time totals, unaffected by period)
    const moneyInInCents = accountTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amountInCents, 0)

    const moneyOutInCents = accountTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amountInCents, 0)

    // Fees: transactions in category 'Other' with 'fee' in merchant name
    const feesInCents = 0

    // Interest: income transactions from 'Interest' merchant
    const interestInCents = accountTransactions
      .filter(
        (tx) => tx.type === 'income' && tx.merchant.toLowerCase() === 'interest',
      )
      .reduce((sum, tx) => sum + tx.amountInCents, 0)

    // Balance history — computed from real account transactions for each period
    const { dataByPeriod, labelsByPeriod } = computeCashFlow(
      accountTransactions,
      account.balanceInCents,
      new Date(),
    )

    const detail: AccountDetail = {
      account,
      recentTransactions,
      monthlySummary: {
        moneyInInCents,
        moneyOutInCents,
        feesInCents,
        interestInCents,
      },
      period: selectedPeriod,
      balanceHistoryByPeriod: dataByPeriod,
      balanceHistoryLabelsByPeriod: labelsByPeriod,
    }

    return ok(detail)
  } catch (error) {
    console.error('[GET /api/accounts/[id]]', error)
    return err('Failed to load account detail', 'ACCOUNT_DETAIL_ERROR', 500)
  }
}
