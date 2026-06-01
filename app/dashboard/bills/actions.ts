'use server'

/**
 * Server actions for the Bills page.
 * All monetary values are stored and operated on in cents (integers only).
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  insertBill,
  updateBill,
  removeBill,
  insertSubscription,
  updateSubscription,
  removeSubscription,
} from '@/lib/data/store'
import { auth } from '@/auth'

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

/**
 * Converts a dollar string to cents as a positive integer.
 * Rejects NaN, negatives, and zero.
 */
const dollarsToCents = z
  .string()
  .transform((v) => Math.round(parseFloat(v) * 100))
  .pipe(z.number().int().positive())

const createBillSchema = z.object({
  name: z
    .string()
    .min(1, 'Bill name is required')
    .max(80, 'Bill name must be 80 characters or fewer'),
  amountDollars: dollarsToCents,
  dueDate: z.string().min(1, 'Due date is required'),
  dueInDays: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(
      z
        .number()
        .int()
        .min(0, 'dueInDays must be 0 or more')
        .max(365, 'dueInDays must be 365 or fewer'),
    ),
  isAutoPay: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  category: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : 'Bills')),
  icon: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : 'bill')),
  color: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : 'var(--cat-1)')),
})

// ---------------------------------------------------------------------------
// Create bill
// ---------------------------------------------------------------------------

export async function createBill(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const raw = {
      name: val(formData, 'name'),
      amountDollars: val(formData, 'amountDollars'),
      dueDate: val(formData, 'dueDate'),
      dueInDays: val(formData, 'dueInDays'),
      isAutoPay: val(formData, 'isAutoPay'),
      category: val(formData, 'category'),
      icon: val(formData, 'icon'),
      color: val(formData, 'color'),
    }

    const parsed = createBillSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: message }
    }

    const { name, amountDollars, dueDate, dueInDays, isAutoPay, category, icon, color } =
      parsed.data

    const id = crypto.randomUUID()
    const isUrgent = dueInDays <= 3

    await insertBill({
      id,
      name,
      amountInCents: amountDollars,
      dueDate,
      dueInDays,
      isAutoPay,
      isUrgent,
      category,
      icon,
      color,
    }, userId)

    revalidatePath('/dashboard/bills')
    revalidatePath('/dashboard')

    return { success: true, id }
  } catch (err) {
    console.error('[createBill] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Update bill
// ---------------------------------------------------------------------------

const updateBillSchema = z.object({
  id: z.string().min(1, 'Bill id is required'),
  name: z
    .string()
    .min(1, 'Bill name is required')
    .max(80, 'Bill name must be 80 characters or fewer'),
  amountDollars: dollarsToCents,
  dueDate: z.string().min(1, 'Due date is required'),
  dueInDays: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(
      z
        .number()
        .int()
        .min(0, 'dueInDays must be 0 or more')
        .max(365, 'dueInDays must be 365 or fewer'),
    ),
  isAutoPay: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  category: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : 'Bills')),
})

export async function updateBillAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const raw = {
      id: val(formData, 'id'),
      name: val(formData, 'name'),
      amountDollars: val(formData, 'amountDollars'),
      dueDate: val(formData, 'dueDate'),
      dueInDays: val(formData, 'dueInDays'),
      isAutoPay: val(formData, 'isAutoPay'),
      category: val(formData, 'category'),
    }

    const parsed = updateBillSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: message }
    }

    const { id, name, amountDollars, dueDate, dueInDays, isAutoPay, category } = parsed.data
    const isUrgent = dueInDays <= 3

    await updateBill(id, {
      name,
      amountInCents: amountDollars,
      dueDate,
      dueInDays,
      isAutoPay,
      isUrgent,
      category,
    }, userId)

    revalidatePath('/dashboard/bills')
    revalidatePath('/dashboard')

    return { success: true, id }
  } catch (err) {
    console.error('[updateBillAction] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Delete bill
// ---------------------------------------------------------------------------

export async function deleteBillAction(formData: FormData): Promise<ActionResult> {
  try {
    const id = val(formData, 'id')
    if (typeof id !== 'string' || id.length === 0) {
      return { success: false, error: 'Bill id is required' }
    }

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    await removeBill(id, userId)

    revalidatePath('/dashboard/bills')
    revalidatePath('/dashboard')

    return { success: true, id }
  } catch (err) {
    console.error('[deleteBillAction] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Subscription schemas
// ---------------------------------------------------------------------------

const createSubscriptionSchema = z.object({
  name: z
    .string()
    .min(1, 'Subscription name is required')
    .max(80, 'Subscription name must be 80 characters or fewer'),
  amountDollars: dollarsToCents,
  nextDate: z.string().min(1, 'Next date is required'),
  isUsed: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  icon: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : 'star')),
  color: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : 'var(--cat-1)')),
})

const updateSubscriptionSchema = z.object({
  id: z.string().min(1, 'Subscription id is required'),
  name: z
    .string()
    .min(1, 'Subscription name is required')
    .max(80, 'Subscription name must be 80 characters or fewer'),
  amountDollars: dollarsToCents,
  nextDate: z.string().min(1, 'Next date is required'),
  isUsed: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
})

// ---------------------------------------------------------------------------
// Create subscription
// ---------------------------------------------------------------------------

export async function createSubscription(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const raw = {
      name: val(formData, 'name'),
      amountDollars: val(formData, 'amountDollars'),
      nextDate: val(formData, 'nextDate'),
      isUsed: val(formData, 'isUsed'),
      icon: val(formData, 'icon'),
      color: val(formData, 'color'),
    }

    const parsed = createSubscriptionSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: message }
    }

    const { name, amountDollars, nextDate, isUsed, icon, color } = parsed.data
    const id = crypto.randomUUID()

    await insertSubscription({
      id,
      name,
      amountMonthlyInCents: amountDollars,
      nextDate,
      isUsed,
      icon,
      color,
    }, userId)

    revalidatePath('/dashboard/bills')

    return { success: true, id }
  } catch (err) {
    console.error('[createSubscription] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Update subscription
// ---------------------------------------------------------------------------

export async function updateSubscriptionAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const raw = {
      id: val(formData, 'id'),
      name: val(formData, 'name'),
      amountDollars: val(formData, 'amountDollars'),
      nextDate: val(formData, 'nextDate'),
      isUsed: val(formData, 'isUsed'),
    }

    const parsed = updateSubscriptionSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: message }
    }

    const { id, name, amountDollars, nextDate, isUsed } = parsed.data

    await updateSubscription(id, {
      name,
      amountMonthlyInCents: amountDollars,
      nextDate,
      isUsed,
    }, userId)

    revalidatePath('/dashboard/bills')

    return { success: true, id }
  } catch (err) {
    console.error('[updateSubscriptionAction] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Delete subscription
// ---------------------------------------------------------------------------

export async function deleteSubscriptionAction(formData: FormData): Promise<ActionResult> {
  try {
    const id = val(formData, 'id')
    if (typeof id !== 'string' || id.length === 0) {
      return { success: false, error: 'Subscription id is required' }
    }

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    await removeSubscription(id, userId)

    revalidatePath('/dashboard/bills')

    return { success: true, id }
  } catch (err) {
    console.error('[deleteSubscriptionAction] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
