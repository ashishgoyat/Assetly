/**
 * Zod schemas for validating API route query parameters.
 */

import { z } from 'zod'
import type { TransactionCategory } from '@/contracts/api-contracts'

const TRANSACTION_CATEGORIES: [TransactionCategory, ...TransactionCategory[]] =
  [
    'Groceries',
    'Dining',
    'Transport',
    'Shopping',
    'Entertainment',
    'Subscriptions',
    'Bills',
    'Transfers',
    'Income',
    'Utilities',
    'Housing',
    'Fitness',
    'Other',
  ]

// Coerce a string query param to a positive integer with a fallback default.
function coerceIntParam(raw: string | null | undefined, fallback: number): number {
  if (raw === null || raw === undefined || raw === '') return fallback
  const parsed = parseInt(raw, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

const transactionsQueryRawSchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  category: z.enum(TRANSACTION_CATEGORIES).optional(),
  accountId: z.string().optional(),
  q: z.string().trim().optional(),
})

export interface TransactionsQuery {
  page: number
  pageSize: number
  category?: TransactionCategory
  accountId?: string
  q?: string
}

export function parseTransactionsQuery(
  searchParams: URLSearchParams,
): { success: true; data: TransactionsQuery } | { success: false; message: string } {
  const raw = {
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    accountId: searchParams.get('accountId') ?? undefined,
    q: searchParams.get('q') ?? undefined,
  }

  const parsed = transactionsQueryRawSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  const page = coerceIntParam(parsed.data.page, 1)
  const pageSize = coerceIntParam(parsed.data.pageSize, 20)

  if (page < 1) return { success: false, message: 'page must be >= 1' }
  if (pageSize < 1 || pageSize > 100) {
    return { success: false, message: 'pageSize must be between 1 and 100' }
  }

  return {
    success: true,
    data: {
      page,
      pageSize,
      category: parsed.data.category,
      accountId: parsed.data.accountId,
      ...(parsed.data.q !== undefined && parsed.data.q !== '' ? { q: parsed.data.q } : {}),
    },
  }
}
