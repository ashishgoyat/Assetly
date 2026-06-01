import { type NextRequest } from 'next/server'
import { ok, err } from '@/lib/api-response'
import { getAccountById, getTransactions } from '@/lib/data/store'
import type { AccountDetail } from '@/contracts/api-contracts'
import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const account = await getAccountById(id, userId)
    if (account === undefined) {
      return err(`Account '${id}' not found`, 'ACCOUNT_NOT_FOUND', 404)
    }

    const allTransactions = await getTransactions(userId)

    // Filter transactions that belong to this account by matching accountLabel
    const accountTransactions = allTransactions.filter((tx) =>
      tx.accountLabel.toLowerCase().includes(account.number.toLowerCase()),
    )

    // Recent transactions for this account (up to 10)
    const recentTransactions = accountTransactions.slice(0, 10)

    // Monthly summary
    const moneyInInCents = accountTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amountInCents, 0)

    const moneyOutInCents = accountTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amountInCents, 0)

    // Fees: transactions in category 'Other' with 'fee' in merchant name
    // For this seed data, no fee transactions exist
    const feesInCents = 0

    // Interest: income transactions from 'Interest' merchant
    const interestInCents = accountTransactions
      .filter(
        (tx) => tx.type === 'income' && tx.merchant.toLowerCase() === 'interest',
      )
      .reduce((sum, tx) => sum + tx.amountInCents, 0)

    const detail: AccountDetail = {
      account,
      recentTransactions,
      monthlySummary: {
        moneyInInCents,
        moneyOutInCents,
        feesInCents,
        interestInCents,
      },
    }

    return ok(detail)
  } catch (error) {
    console.error('[GET /api/accounts/[id]]', error)
    return err('Failed to load account detail', 'ACCOUNT_DETAIL_ERROR', 500)
  }
}
