'use server'

/**
 * Server actions for the Budgets page.
 * All monetary values are stored and operated on in cents (integers only).
 */

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { z } from 'zod'
import { insertBudget, updateBudget, removeBudget } from '@/lib/data/store'
import type { TransactionCategory } from '@/contracts/api-contracts'
import { auth } from '@/auth'
import { sendPendingNotificationEmails } from '@/lib/email'

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

type ActionResult = { success: true; id: string } | { success: false; error: string }

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

/**
 * Converts a dollar string to cents as a positive integer.
 * Rejects NaN, negatives, and zero.
 */
const dollarsToCents = z
  .string()
  .transform((v) => Math.round(parseFloat(v) * 100))
  .pipe(z.number().int().positive())

const createBudgetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  category: z.enum(TRANSACTION_CATEGORIES),
  limitDollars: dollarsToCents,
  icon: z.string().min(1),
  color: z.string().min(1),
})

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export async function createBudget(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const raw = {
      name: val(formData, 'name'),
      category: val(formData, 'category'),
      limitDollars: val(formData, 'limitDollars'),
      icon: val(formData, 'icon'),
      color: val(formData, 'color'),
    }

    const parsed = createBudgetSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: message }
    }

    const { name, category, limitDollars, icon, color } = parsed.data
    const id = crypto.randomUUID()

    await insertBudget({
      id,
      name,
      category,
      limitInCents: limitDollars,
      spentInCents: 0,
      percentageUsed: 0,
      icon,
      color,
      isOver: false,
    }, userId)

    revalidatePath('/dashboard/budgets')
    revalidatePath('/dashboard')

    after(() => sendPendingNotificationEmails(userId))
    return { success: true, id }
  } catch (err) {
    console.error('[createBudget] unexpected error:', err)
    return { success: false, error: 'Failed to create budget. Please try again.' }
  }
}

export async function updateBudgetLimit(
  id: string,
  newLimitDollars: string,
): Promise<ActionResult> {
  if (!id) return { success: false, error: 'Missing budget id' }

  try {
    const cents = Math.round(parseFloat(newLimitDollars) * 100)

    if (isNaN(cents)) return { success: false, error: 'Invalid limit value' }
    if (cents <= 0) return { success: false, error: 'Limit must be a positive amount' }

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    await updateBudget(id, { limitInCents: cents }, userId)

    revalidatePath('/dashboard/budgets')
    revalidatePath('/dashboard')

    after(() => sendPendingNotificationEmails(userId))
    return { success: true, id }
  } catch (err) {
    console.error('[updateBudgetLimit] unexpected error:', err)
    return { success: false, error: 'Failed to update budget. Please try again.' }
  }
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: 'Missing budget id' }

  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    await removeBudget(id, userId)

    revalidatePath('/dashboard/budgets')
    revalidatePath('/dashboard')

    return { success: true, id }
  } catch (err) {
    console.error('[deleteBudget] unexpected error:', err)
    return { success: false, error: 'Failed to delete budget. Please try again.' }
  }
}
