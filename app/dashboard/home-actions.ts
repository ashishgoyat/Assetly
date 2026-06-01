'use server'

/**
 * Server actions for the Home dashboard quick-action buttons
 * (expandable rows for bills, transactions, and goals).
 *
 * All monetary values are stored and operated on in cents (integers only).
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  getBills,
  updateBill,
  removeBill,
  insertTransaction,
  updateTransaction,
  removeTransaction,
  getGoalById,
  updateGoal,
  getSubscriptions,
  updateSubscription,
} from '@/lib/data/store'
import { auth } from '@/auth'

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

type ActionResult = { success: true; id?: string } | { success: false; error: string }

// ---------------------------------------------------------------------------
// Safe formData reader — converts null/File to undefined so Zod optional schemas
// accept missing form fields.
// ---------------------------------------------------------------------------

function val(fd: FormData, key: string): string | undefined {
  const v = fd.get(key)
  return typeof v === 'string' ? v : undefined
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const idSchema = z.string().min(1, 'id is required')

const dollarsString = z
  .string()
  .regex(/^\d+(\.\d+)?$/, 'Amount must be a positive number')

const TRANSACTION_CATEGORIES = [
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
] as const

const categorySchema = z.enum(TRANSACTION_CATEGORIES)
const noteSchema = z.string().max(500).optional()

// ---------------------------------------------------------------------------
// Time / date formatters
// ---------------------------------------------------------------------------

function formatTime(date: Date): string {
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  const paddedMinutes = minutes.toString().padStart(2, '0')
  return `${hours}:${paddedMinutes} ${ampm}`
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

function monthYearLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function computeGoalEta(
  remainingInCents: number,
  monthlyContributionInCents: number,
): string {
  if (monthlyContributionInCents <= 0) return 'Paused'
  const monthsNeeded = Math.ceil(Math.max(0, remainingInCents) / monthlyContributionInCents)
  const now = new Date()
  const etaDate = new Date(now.getFullYear(), now.getMonth() + monthsNeeded, 1)
  return monthYearLabel(etaDate)
}

// ---------------------------------------------------------------------------
// Bill actions
// ---------------------------------------------------------------------------

export async function payBill(formData: FormData): Promise<ActionResult> {
  try {
    const idParsed = idSchema.safeParse(val(formData, 'id'))
    if (!idParsed.success) {
      return { success: false, error: 'Bill id is required' }
    }
    const id = idParsed.data

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const bills = await getBills(userId)
    const bill = bills.find((b) => b.id === id)
    if (!bill) return { success: false, error: 'Bill not found' }

    // Bill payments always count against the "Bills" budget category.
    const now = new Date()
    const txId = crypto.randomUUID()
    await insertTransaction({
      id: txId,
      date: now.toISOString().slice(0, 10),
      time: formatTime(now),
      merchant: bill.name,
      category: 'Bills',
      accountLabel: 'Auto',
      amountInCents: bill.amountInCents,
      type: 'expense',
      status: 'posted',
    }, userId)

    await removeBill(id, userId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bills')
    revalidatePath('/dashboard/transactions')
    revalidatePath('/dashboard/budgets')

    return { success: true, id }
  } catch (err) {
    console.error('[payBill] unexpected error:', err)
    return { success: false, error: 'Failed to pay bill. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Subscription actions
// ---------------------------------------------------------------------------

function formatShortDate(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`
}

export async function paySubscription(subscriptionId: string): Promise<ActionResult> {
  try {
    const idParsed = idSchema.safeParse(subscriptionId)
    if (!idParsed.success) {
      return { success: false, error: 'Subscription id is required' }
    }
    const id = idParsed.data

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const subs = await getSubscriptions(userId)
    const sub = subs.find((s) => s.id === id)
    if (!sub) return { success: false, error: 'Subscription not found' }

    // Insert an expense transaction so it counts against the Subscriptions budget.
    const now = new Date()
    const txId = crypto.randomUUID()
    await insertTransaction({
      id: txId,
      date: now.toISOString().slice(0, 10),
      time: formatTime(now),
      merchant: sub.name,
      category: 'Subscriptions',
      accountLabel: 'Auto',
      amountInCents: sub.amountMonthlyInCents,
      type: 'expense',
      status: 'posted',
    }, userId)

    // Advance nextDate by ~1 month (30 days) using the same short-label format
    // as the seed data (e.g. "May 5").
    const nextDate = new Date(now.getTime() + 30 * 86_400_000)
    await updateSubscription(id, {
      nextDate: formatShortDate(nextDate),
    }, userId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bills')
    revalidatePath('/dashboard/budgets')

    return { success: true, id }
  } catch (err) {
    console.error('[paySubscription] unexpected error:', err)
    return { success: false, error: 'Failed to pay subscription. Please try again.' }
  }
}

export async function skipBill(formData: FormData): Promise<ActionResult> {
  try {
    const idParsed = idSchema.safeParse(val(formData, 'id'))
    if (!idParsed.success) {
      return { success: false, error: 'Bill id is required' }
    }
    const id = idParsed.data

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const bills = await getBills(userId)
    const bill = bills.find((b) => b.id === id)
    if (!bill) return { success: false, error: 'Bill not found' }

    await updateBill(id, {
      dueInDays: bill.dueInDays + 30,
      isUrgent: false,
    }, userId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bills')

    return { success: true, id }
  } catch (err) {
    console.error('[skipBill] unexpected error:', err)
    return { success: false, error: 'Failed to skip bill. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Transaction actions
// ---------------------------------------------------------------------------

export async function setTransactionCategory(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const idParsed = idSchema.safeParse(val(formData, 'id'))
    if (!idParsed.success) {
      return { success: false, error: 'Transaction id is required' }
    }
    const categoryParsed = categorySchema.safeParse(val(formData, 'category'))
    if (!categoryParsed.success) {
      return { success: false, error: 'A valid category is required' }
    }

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    await updateTransaction(idParsed.data, { category: categoryParsed.data }, userId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/transactions')

    return { success: true, id: idParsed.data }
  } catch (err) {
    console.error('[setTransactionCategory] unexpected error:', err)
    return { success: false, error: 'Failed to update category. Please try again.' }
  }
}

export async function setTransactionNote(formData: FormData): Promise<ActionResult> {
  try {
    const idParsed = idSchema.safeParse(val(formData, 'id'))
    if (!idParsed.success) {
      return { success: false, error: 'Transaction id is required' }
    }
    const noteRaw = val(formData, 'note')
    const noteParsed = noteSchema.safeParse(noteRaw)
    if (!noteParsed.success) {
      return { success: false, error: 'Note must be 500 characters or fewer' }
    }
    const note = noteParsed.data && noteParsed.data.length > 0 ? noteParsed.data : null

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    await updateTransaction(idParsed.data, { note }, userId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/transactions')

    return { success: true, id: idParsed.data }
  } catch (err) {
    console.error('[setTransactionNote] unexpected error:', err)
    return { success: false, error: 'Failed to update note. Please try again.' }
  }
}

export async function excludeTransaction(formData: FormData): Promise<ActionResult> {
  try {
    const idParsed = idSchema.safeParse(val(formData, 'id'))
    if (!idParsed.success) {
      return { success: false, error: 'Transaction id is required' }
    }

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    await removeTransaction(idParsed.data, userId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/transactions')

    return { success: true, id: idParsed.data }
  } catch (err) {
    console.error('[excludeTransaction] unexpected error:', err)
    return { success: false, error: 'Failed to exclude transaction. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Goal actions
// ---------------------------------------------------------------------------

export async function addFundsToGoalAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const idParsed = idSchema.safeParse(val(formData, 'id'))
    if (!idParsed.success) {
      return { success: false, error: 'Goal id is required' }
    }
    const amountParsed = dollarsString.safeParse(val(formData, 'amountDollars'))
    if (!amountParsed.success) {
      return { success: false, error: 'Amount must be a positive number' }
    }
    const amountCents = Math.round(parseFloat(amountParsed.data) * 100)
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      return { success: false, error: 'Amount must be a positive number' }
    }

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const goal = await getGoalById(idParsed.data, userId)
    if (!goal) return { success: false, error: 'Goal not found' }

    const newCurrent = goal.currentInCents + amountCents
    const newPercentage =
      goal.targetInCents > 0
        ? clamp(Math.round((newCurrent / goal.targetInCents) * 100), 0, 100)
        : 0
    const remaining = Math.max(0, goal.targetInCents - newCurrent)
    const newEta = computeGoalEta(remaining, goal.monthlyContributionInCents)

    await updateGoal(idParsed.data, {
      currentInCents: newCurrent,
      percentageComplete: newPercentage,
      eta: newEta,
    }, userId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/goals')

    return { success: true, id: idParsed.data }
  } catch (err) {
    console.error('[addFundsToGoalAction] unexpected error:', err)
    return { success: false, error: 'Failed to add funds. Please try again.' }
  }
}

export async function setGoalMonthly(formData: FormData): Promise<ActionResult> {
  try {
    const idParsed = idSchema.safeParse(val(formData, 'id'))
    if (!idParsed.success) {
      return { success: false, error: 'Goal id is required' }
    }
    const amountParsed = dollarsString.safeParse(val(formData, 'monthlyDollars'))
    if (!amountParsed.success) {
      return { success: false, error: 'Monthly amount must be a positive number' }
    }
    const monthlyCents = Math.round(parseFloat(amountParsed.data) * 100)
    if (!Number.isInteger(monthlyCents) || monthlyCents <= 0) {
      return { success: false, error: 'Monthly amount must be a positive number' }
    }

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const goal = await getGoalById(idParsed.data, userId)
    if (!goal) return { success: false, error: 'Goal not found' }

    const remaining = Math.max(0, goal.targetInCents - goal.currentInCents)
    const newEta = computeGoalEta(remaining, monthlyCents)

    await updateGoal(idParsed.data, {
      monthlyContributionInCents: monthlyCents,
      eta: newEta,
    }, userId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/goals')

    return { success: true, id: idParsed.data }
  } catch (err) {
    console.error('[setGoalMonthly] unexpected error:', err)
    return { success: false, error: 'Failed to update monthly amount. Please try again.' }
  }
}

export async function pauseGoal(formData: FormData): Promise<ActionResult> {
  try {
    const idParsed = idSchema.safeParse(val(formData, 'id'))
    if (!idParsed.success) {
      return { success: false, error: 'Goal id is required' }
    }

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    await updateGoal(idParsed.data, {
      monthlyContributionInCents: 0,
      eta: 'Paused',
    }, userId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/goals')

    return { success: true, id: idParsed.data }
  } catch (err) {
    console.error('[pauseGoal] unexpected error:', err)
    return { success: false, error: 'Failed to pause goal. Please try again.' }
  }
}
