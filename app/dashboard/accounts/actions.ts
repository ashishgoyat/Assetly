'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { insertAccount, updateAccount, removeAccount } from '@/lib/data/store'
import { auth } from '@/auth'

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
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const raw = {
      name: val(formData, 'name'),
      type: val(formData, 'type'),
      balanceDollars: val(formData, 'balanceDollars'),
      lastFour: val(formData, 'lastFour'),
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
    }, userId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/accounts')

    return { success: true, id }
  } catch (err) {
    console.error('[createAccount] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

const updateAccountSchema = z.object({
  id: z.string().min(1, 'Account id is required'),
  name: z.string().min(1, 'Account name is required').max(80),
  balanceDollars: dollarsToCents,
})

export async function updateAccountAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const raw = {
      id: val(formData, 'id'),
      name: val(formData, 'name'),
      balanceDollars: val(formData, 'balanceDollars'),
    }

    const parsed = updateAccountSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: message }
    }

    const { id, name, balanceDollars } = parsed.data

    await updateAccount(id, { name, balanceInCents: balanceDollars }, userId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/accounts')
    revalidatePath(`/dashboard/accounts/${id}`)

    return { success: true, id }
  } catch (err) {
    console.error('[updateAccountAction] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteAccountAction(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Account id is required' }
    }

    await removeAccount(id, userId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/accounts')
    revalidatePath(`/dashboard/accounts/${id}`)

    return { success: true, id }
  } catch (err) {
    console.error('[deleteAccountAction] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
