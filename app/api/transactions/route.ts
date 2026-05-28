import { type NextRequest } from 'next/server'
import { ok, err } from '@/lib/api-response'
import { getTransactions } from '@/lib/data/store'
import { parseTransactionsQuery } from '@/lib/validations/query-params'
import { daysInMonth as daysInMonthFn } from '@/lib/calculations'
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

    // Daily average out = moneyOut / actual days in the month of the earliest filtered transaction
    const daysInMonthVal =
      filtered.length > 0
        ? (() => {
            const parts = filtered[0].date.split('-')
            return daysInMonthFn(Number(parts[0]), Number(parts[1]))
          })()
        : 30
    const dailyAvgOutInCents = Math.round(moneyOutInCents / daysInMonthVal)

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
