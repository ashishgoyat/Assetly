'use server'

/**
 * Server actions for the Bills page.
 * All monetary values are stored and operated on in cents (integers only).
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { bills } from '@/lib/data/store'

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
// Action
// ---------------------------------------------------------------------------

export async function createBill(formData: FormData): Promise<ActionResult> {
  try {
    const raw = {
      name: formData.get('name'),
      amountDollars: formData.get('amountDollars'),
      dueDate: formData.get('dueDate'),
      dueInDays: formData.get('dueInDays'),
      isAutoPay: formData.get('isAutoPay'),
      category: formData.get('category'),
      icon: formData.get('icon'),
      color: formData.get('color'),
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

    bills.push({
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
    })

    revalidatePath('/dashboard/bills')
    revalidatePath('/dashboard')

    return { success: true, id }
  } catch (err) {
    console.error('[createBill] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
