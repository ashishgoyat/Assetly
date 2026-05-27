import { type NextRequest } from 'next/server'
import { ok, err } from '@/lib/api-response'
import { getTransactions } from '@/lib/data/store'
import { parseTransactionsQuery } from '@/lib/validations/query-params'
import type { TransactionsSummary } from '@/contracts/api-contracts'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl

    // --- Validate query params ---
    const parsed = parseTransactionsQuery(searchParams)
    if (!parsed.success) {
      return err(parsed.message, 'INVALID_QUERY_PARAMS', 400)
    }

    const { page, pageSize, category, accountId } = parsed.data

    const allTransactions = await getTransactions()

    // --- Apply filters ---
    let filtered = allTransactions
    if (category !== undefined) {
      filtered = filtered.filter((tx) => tx.category === category)
    }
    if (accountId !== undefined) {
      filtered = filtered.filter((tx) =>
        tx.accountLabel.toLowerCase().includes(accountId.toLowerCase()),
      )
    }

    // --- Compute summary over full filtered set (before pagination) ---
    const moneyInInCents = filtered
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amountInCents, 0)

    const moneyOutInCents = filtered
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amountInCents, 0)

    const netInCents = moneyInInCents - moneyOutInCents

    // Daily average out = moneyOut / days in month (April = 30 days)
    const daysInMonth = 30
    const dailyAvgOutInCents = Math.round(moneyOutInCents / daysInMonth)

    const summary: TransactionsSummary = {
      moneyInInCents,
      moneyOutInCents,
      netInCents,
      dailyAvgOutInCents,
    }

    // --- Paginate ---
    const total = filtered.length
    const offset = (page - 1) * pageSize
    const items = filtered.slice(offset, offset + pageSize)

    return ok({
      items: {
        items,
        total,
        page,
        pageSize,
      },
      summary,
    })
  } catch (error) {
    console.error('[GET /api/transactions]', error)
    return err('Failed to load transactions', 'TRANSACTIONS_ERROR', 500)
  }
}
