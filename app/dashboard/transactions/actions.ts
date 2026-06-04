'use server'

/**
 * Server actions for the Transactions page.
 * All monetary values are stored and operated on in cents (integers only).
 */

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { z } from 'zod'
import { insertTransaction, removeTransaction, updateTransaction, adjustAccountBalanceByLabel, getAccounts } from '@/lib/data/store'
import type { Transaction, TransactionCategory, TransactionType, PaymentMethod } from '@/contracts/api-contracts'
import { auth } from '@/auth'
import { sendPendingNotificationEmails } from '@/lib/email'

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

type ActionResult =
  | { success: true; id: string; transaction?: Transaction }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// Safe formData reader — converts null/File to undefined so Zod optional schemas
// accept missing form fields. (formData.get returns null when the field is
// absent, which fails z.string().optional() because Zod treats null != undefined.)
// ---------------------------------------------------------------------------

function val(fd: FormData, key: string): string | undefined {
  const v = fd.get(key)
  return typeof v === 'string' ? v : undefined
}

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
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const paymentMethod = (val(formData, 'paymentMethod') as PaymentMethod | undefined) ?? undefined

    const raw = {
      merchant: val(formData, 'merchant'),
      amountDollars: val(formData, 'amountDollars'),
      type: val(formData, 'type'),
      category: val(formData, 'category'),
      accountLabel: val(formData, 'accountLabel'),
    }

    const parsed = createTransactionSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: message }
    }

    const { merchant, amountDollars, type, category, accountLabel } = parsed.data

    // Block expense transactions that would push the account below $0
    if (type === 'expense') {
      const allAccounts = await getAccounts(userId)
      const account = allAccounts.find((a) => `${a.name} ${a.number}` === accountLabel)
      if (account && account.balanceInCents < amountDollars) {
        const available = (account.balanceInCents / 100).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        })
        const attempted = (amountDollars / 100).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        })
        return {
          success: false,
          error: `Insufficient funds. ${account.name} has ${available} available, but this transaction requires ${attempted}.`,
        }
      }
    }

    const id = crypto.randomUUID()
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const time = formatTime(now)

    // DB query orders by date DESC, time DESC — insert without unshift
    await insertTransaction({
      id,
      date,
      time,
      merchant,
      category,
      accountLabel,
      amountInCents: amountDollars,
      type,
      status: 'posted',
      ...(paymentMethod !== undefined ? { paymentMethod } : {}),
    }, userId)

    // Adjust account balance: expenses subtract, income adds
    const delta = type === 'income' ? amountDollars : -amountDollars
    await adjustAccountBalanceByLabel(accountLabel, userId, delta)

    revalidatePath('/dashboard/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/accounts')

    after(() => sendPendingNotificationEmails(userId))

    return {
      success: true as const,
      id,
      transaction: {
        id,
        date,
        time,
        merchant,
        category,
        accountLabel,
        amountInCents: amountDollars,
        type,
        status: 'posted' as const,
        ...(paymentMethod !== undefined ? { paymentMethod } : {}),
      } satisfies Transaction,
    }
  } catch (err) {
    console.error('[createTransaction] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid transaction ID.' }
    }
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    await removeTransaction(id, userId)
    revalidatePath('/dashboard/transactions')
    revalidatePath('/dashboard')
    return { success: true, id }
  } catch (err) {
    console.error('[deleteTransaction] unexpected error:', err)
    return { success: false, error: 'Failed to delete transaction. Please try again.' }
  }
}

const PAYMENT_METHODS = ['upi', 'card', 'cash', 'bank_transfer', 'net_banking', 'other'] as const

const updateTransactionSchema = z.object({
  merchant: z.string().min(1, 'Merchant is required').max(100),
  category: z.enum(TRANSACTION_CATEGORIES),
  accountLabel: z.string().min(1, 'Account is required'),
  status: z.enum(['posted', 'pending'] as const),
  note: z.string().max(500).nullable().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).nullable().optional(),
})

export async function updateTransactionAction(
  id: string,
  raw: {
    merchant: string
    category: string
    accountLabel: string
    status: string
    note: string | null
    paymentMethod?: string | null
  },
): Promise<ActionResult> {
  try {
    if (!id) return { success: false, error: 'Invalid transaction ID.' }

    const parsed = updateTransactionSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: message }
    }

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    await updateTransaction(id, {
      ...parsed.data,
      paymentMethod: parsed.data.paymentMethod ?? null,
    }, userId)
    revalidatePath('/dashboard/transactions')
    revalidatePath('/dashboard')

    return { success: true, id }
  } catch (err) {
    console.error('[updateTransactionAction] unexpected error:', err)
    return { success: false, error: 'Failed to update transaction. Please try again.' }
  }
}
