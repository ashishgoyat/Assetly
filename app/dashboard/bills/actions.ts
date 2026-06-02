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
import type { Bill, Subscription } from '@/contracts/api-contracts'

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

type ActionResult = { success: true; id: string } | { success: false; error: string }
type BillActionResult = { success: true; bill: Bill } | { success: false; error: string }
type SubActionResult =
  | { success: true; subscription: Subscription }
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
// Date conversion helpers
// ---------------------------------------------------------------------------

/**
 * Converts an ISO date string (YYYY-MM-DD from <input type="date">) to a
 * display format like "Jun 1". The date is parsed at midnight local time to
 * avoid UTC-offset day-shift bugs.
 */
function isoToDisplay(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Computes the number of calendar days between today (midnight local) and the
 * date represented by the ISO string. May be negative if the date is in the past.
 */
function computeDueInDaysFromISO(iso: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(iso + 'T00:00:00')
  return Math.round((due.getTime() - today.getTime()) / 86400000)
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
  // dueDate arrives as YYYY-MM-DD from <input type="date">
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
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

export async function createBill(formData: FormData): Promise<BillActionResult> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const raw = {
      name: val(formData, 'name'),
      amountDollars: val(formData, 'amountDollars'),
      dueDate: val(formData, 'dueDate'),
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

    const { name, amountDollars, dueDate: dueDateISO, isAutoPay, category, icon, color } =
      parsed.data

    const displayDueDate = isoToDisplay(dueDateISO)
    const dueInDays = computeDueInDaysFromISO(dueDateISO)
    const isUrgent = dueInDays <= 3
    const id = crypto.randomUUID()

    await insertBill({
      id,
      name,
      amountInCents: amountDollars,
      dueDate: displayDueDate,
      dueInDays,
      isAutoPay,
      isUrgent,
      category,
      icon,
      color,
    }, userId)

    revalidatePath('/dashboard/bills')
    revalidatePath('/dashboard')

    const bill: Bill = {
      id,
      name,
      amountInCents: amountDollars,
      dueDate: displayDueDate,
      dueInDays,
      isAutoPay,
      isUrgent,
      category,
      icon,
      color,
    }

    return { success: true, bill }
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
  // dueDate arrives as YYYY-MM-DD from <input type="date">
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
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

export async function updateBillAction(formData: FormData): Promise<BillActionResult> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const raw = {
      id: val(formData, 'id'),
      name: val(formData, 'name'),
      amountDollars: val(formData, 'amountDollars'),
      dueDate: val(formData, 'dueDate'),
      isAutoPay: val(formData, 'isAutoPay'),
      category: val(formData, 'category'),
      icon: val(formData, 'icon'),
      color: val(formData, 'color'),
    }

    const parsed = updateBillSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: message }
    }

    const { id, name, amountDollars, dueDate: dueDateISO, isAutoPay, category, icon, color } =
      parsed.data

    const displayDueDate = isoToDisplay(dueDateISO)
    const dueInDays = computeDueInDaysFromISO(dueDateISO)
    const isUrgent = dueInDays <= 3

    await updateBill(id, {
      name,
      amountInCents: amountDollars,
      dueDate: displayDueDate,
      dueInDays,
      isAutoPay,
      isUrgent,
      category,
    }, userId)

    revalidatePath('/dashboard/bills')
    revalidatePath('/dashboard')

    const bill: Bill = {
      id,
      name,
      amountInCents: amountDollars,
      dueDate: displayDueDate,
      dueInDays,
      isAutoPay,
      isUrgent,
      category,
      icon,
      color,
    }

    return { success: true, bill }
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
  // nextDate arrives as YYYY-MM-DD from <input type="date">
  nextDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Next date must be in YYYY-MM-DD format'),
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
  // nextDate arrives as YYYY-MM-DD from <input type="date">
  nextDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Next date must be in YYYY-MM-DD format'),
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

// ---------------------------------------------------------------------------
// Create subscription
// ---------------------------------------------------------------------------

export async function createSubscription(formData: FormData): Promise<SubActionResult> {
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

    const { name, amountDollars, nextDate: nextDateISO, isUsed, icon, color } = parsed.data
    const displayNextDate = isoToDisplay(nextDateISO)
    const id = crypto.randomUUID()

    await insertSubscription({
      id,
      name,
      amountMonthlyInCents: amountDollars,
      nextDate: displayNextDate,
      isUsed,
      icon,
      color,
    }, userId)

    revalidatePath('/dashboard/bills')

    const subscription: Subscription = {
      id,
      name,
      amountMonthlyInCents: amountDollars,
      nextDate: displayNextDate,
      isUsed,
      icon,
      color,
    }

    return { success: true, subscription }
  } catch (err) {
    console.error('[createSubscription] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Update subscription
// ---------------------------------------------------------------------------

export async function updateSubscriptionAction(formData: FormData): Promise<SubActionResult> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const raw = {
      id: val(formData, 'id'),
      name: val(formData, 'name'),
      amountDollars: val(formData, 'amountDollars'),
      nextDate: val(formData, 'nextDate'),
      isUsed: val(formData, 'isUsed'),
      icon: val(formData, 'icon'),
      color: val(formData, 'color'),
    }

    const parsed = updateSubscriptionSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: message }
    }

    const { id, name, amountDollars, nextDate: nextDateISO, isUsed, icon, color } = parsed.data
    const displayNextDate = isoToDisplay(nextDateISO)

    await updateSubscription(id, {
      name,
      amountMonthlyInCents: amountDollars,
      nextDate: displayNextDate,
      isUsed,
    }, userId)

    revalidatePath('/dashboard/bills')

    const subscription: Subscription = {
      id,
      name,
      amountMonthlyInCents: amountDollars,
      nextDate: displayNextDate,
      isUsed,
      icon,
      color,
    }

    return { success: true, subscription }
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
