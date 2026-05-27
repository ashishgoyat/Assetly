'use server'

/**
 * Server actions for the Transactions page.
 * All monetary values are stored and operated on in cents (integers only).
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { transactions } from '@/lib/data/store'
import type { TransactionCategory, TransactionType } from '@/contracts/api-contracts'

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

type ActionResult = { success: true; id: string } | { success: false; error: string }

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Converts a dollar string to cents as a positive integer.
 * Rejects NaN, negatives, and zero.
 */
const dollarsToCents = z
  .string()
  .transform((v) => Math.round(parseFloat(v) * 100))
  .pipe(z.number().int().positive())

const TRANSACTION_CATEGORIES: [TransactionCategory, ...TransactionCategory[]] = [
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

const TRANSACTION_TYPES: [TransactionType, ...TransactionType[]] = ['income', 'expense']

const createTransactionSchema = z.object({
  merchant: z
    .string()
    .min(1, 'Merchant name is required')
    .max(100, 'Merchant name must be 100 characters or fewer'),
  amountDollars: dollarsToCents,
  type: z.enum(TRANSACTION_TYPES),
  category: z.enum(TRANSACTION_CATEGORIES),
  accountLabel: z.string().min(1, 'Account is required'),
})

// ---------------------------------------------------------------------------
// Time formatter
// ---------------------------------------------------------------------------

/**
 * Formats the current time as "h:mm AM/PM" (e.g. "3:04 PM").
 */
function formatTime(date: Date): string {
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  const paddedMinutes = minutes.toString().padStart(2, '0')
  return `${hours}:${paddedMinutes} ${ampm}`
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export async function createTransaction(formData: FormData): Promise<ActionResult> {
  try {
    const raw = {
      merchant: formData.get('merchant'),
      amountDollars: formData.get('amountDollars'),
      type: formData.get('type'),
      category: formData.get('category'),
      accountLabel: formData.get('accountLabel'),
    }

    const parsed = createTransactionSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: message }
    }

    const { merchant, amountDollars, type, category, accountLabel } = parsed.data

    const id = crypto.randomUUID()
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const time = formatTime(now)

    // Unshift so the new transaction appears first (most recent first ordering)
    transactions.unshift({
      id,
      date,
      time,
      merchant,
      category,
      accountLabel,
      amountInCents: amountDollars,
      type,
      status: 'posted',
    })

    revalidatePath('/dashboard/transactions')
    revalidatePath('/dashboard')

    return { success: true, id }
  } catch (err) {
    console.error('[createTransaction] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
