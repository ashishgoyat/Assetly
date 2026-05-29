'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { insertAccount } from '@/lib/data/store'

type ActionResult = { success: true; id: string } | { success: false; error: string }

const ACCOUNT_COLORS = [
  'var(--cat-1)', 'var(--cat-2)', 'var(--cat-3)',
  'var(--cat-4)', 'var(--cat-5)', 'var(--cat-6)',
]

const dollarsToCents = z
  .string()
  .transform((v) => Math.round(parseFloat(v) * 100))
  .pipe(z.number().int().min(0, 'Balance must be 0 or more'))

const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(80),
  type: z.enum(['checking', 'savings', 'investment'] as const, {
    error: 'Account type is required',
  }),
  balanceDollars: dollarsToCents,
  lastFour: z
    .string()
    .regex(/^\d{4}$/, 'Enter the last 4 digits of your account number'),
})

export async function createAccount(formData: FormData): Promise<ActionResult> {
  try {
    const raw = {
      name: formData.get('name'),
      type: formData.get('type'),
      balanceDollars: formData.get('balanceDollars'),
      lastFour: formData.get('lastFour'),
    }

    const parsed = createAccountSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: message }
    }

    const { name, type, balanceDollars, lastFour } = parsed.data
    const id = crypto.randomUUID()

    const now = new Date()
    const linkedSince = now.toLocaleString('en-US', { month: 'short', year: 'numeric' })
    const color = ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)]

    await insertAccount({
      id,
      name,
      number: `··${lastFour}`,
      balanceInCents: balanceDollars,
      weekDeltaInCents: 0,
      type,
      color,
      linkedSince,
      lastSync: 'Just now',
      balanceHistory: Array(16).fill(balanceDollars),
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/accounts')

    return { success: true, id }
  } catch (err) {
    console.error('[createAccount] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
