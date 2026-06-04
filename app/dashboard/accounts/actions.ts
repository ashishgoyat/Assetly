'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  insertAccount, updateAccount, removeAccount,
  getAccountById, insertTransaction,
  getGoalById, updateGoal,
  adjustAccountBalance, updateAccountLastSync,
} from '@/lib/data/store'
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

export async function syncAccountAction(accountId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    if (!accountId) return { success: false, error: 'Account id is required' }
    await updateAccountLastSync(accountId, userId)
    revalidatePath(`/dashboard/accounts/${accountId}`)
    revalidatePath('/dashboard')
    return { success: true, id: accountId }
  } catch (err) {
    console.error('[syncAccountAction]', err)
    return { success: false, error: 'Sync failed. Please try again.' }
  }
}

const transferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amountDollars: z
    .string()
    .transform((v) => Math.round(parseFloat(v) * 100))
    .pipe(z.number().int().positive('Amount must be positive')),
})

export async function transferMoneyAction(raw: {
  fromAccountId: string
  toAccountId: string
  amountDollars: string
}): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const parsed = transferSchema.safeParse(raw)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') }
    }
    const { fromAccountId, toAccountId, amountDollars: amountInCents } = parsed.data

    if (fromAccountId === toAccountId) return { success: false, error: 'Cannot transfer to the same account.' }

    const fromAccount = await getAccountById(fromAccountId, userId)
    const toAccount = await getAccountById(toAccountId, userId)
    if (!fromAccount || !toAccount) return { success: false, error: 'Account not found.' }
    if (fromAccount.balanceInCents < amountInCents) return { success: false, error: 'Insufficient balance.' }

    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const h = now.getHours(), m = now.getMinutes()
    const ampm = h >= 12 ? 'PM' : 'AM'
    const time = `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`

    await insertTransaction({
      id: crypto.randomUUID(),
      date, time,
      merchant: `Transfer to ${toAccount.name}`,
      category: 'Transfers',
      accountLabel: `${fromAccount.name} ${fromAccount.number}`,
      amountInCents,
      type: 'expense',
      status: 'posted',
    }, userId)

    await insertTransaction({
      id: crypto.randomUUID(),
      date, time,
      merchant: `Transfer from ${fromAccount.name}`,
      category: 'Transfers',
      accountLabel: `${toAccount.name} ${toAccount.number}`,
      amountInCents,
      type: 'income',
      status: 'posted',
    }, userId)

    await adjustAccountBalance(fromAccountId, userId, -amountInCents)
    await adjustAccountBalance(toAccountId, userId, amountInCents)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/accounts')
    revalidatePath(`/dashboard/accounts/${fromAccountId}`)
    revalidatePath(`/dashboard/accounts/${toAccountId}`)
    revalidatePath('/dashboard/transactions')

    return { success: true, id: fromAccountId }
  } catch (err) {
    console.error('[transferMoneyAction]', err)
    return { success: false, error: 'Transfer failed. Please try again.' }
  }
}

const autoSaveSchema = z.object({
  accountId: z.string().min(1),
  goalId: z.string().min(1),
  amountDollars: z
    .string()
    .transform((v) => Math.round(parseFloat(v) * 100))
    .pipe(z.number().int().positive('Amount must be positive')),
  frequency: z.enum(['weekly', 'monthly']),
})

export async function setupAutoSaveAction(raw: {
  accountId: string
  goalId: string
  amountDollars: string
  frequency: 'weekly' | 'monthly'
}): Promise<{ success: true; id: string; nextDate: string } | { success: false; error: string }> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const parsed = autoSaveSchema.safeParse(raw)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') }
    }
    const { accountId, goalId, amountDollars: amountInCents, frequency } = parsed.data

    const account = await getAccountById(accountId, userId)
    const goal = await getGoalById(goalId, userId)
    if (!account || !goal) return { success: false, error: 'Account or goal not found.' }
    if (account.balanceInCents < amountInCents) return { success: false, error: 'Insufficient balance.' }

    const newCurrent = goal.currentInCents + amountInCents
    const percentageComplete = Math.round((newCurrent / goal.targetInCents) * 100)
    const remaining = goal.targetInCents - newCurrent
    const monthly = goal.monthlyContributionInCents || amountInCents
    const monthsToGo = remaining > 0 && monthly > 0 ? Math.ceil(remaining / monthly) : 0
    const eta = monthsToGo === 0
      ? 'Funded'
      : new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
          new Date(Date.now() + monthsToGo * 30 * 24 * 60 * 60 * 1000)
        )

    await updateGoal(goalId, { currentInCents: newCurrent, percentageComplete, eta }, userId)

    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const h = now.getHours(), m = now.getMinutes()
    const ampm = h >= 12 ? 'PM' : 'AM'
    const time = `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`

    await insertTransaction({
      id: crypto.randomUUID(),
      date, time,
      merchant: goal.name,
      category: 'Transfers',
      accountLabel: `${account.name} ${account.number}`,
      amountInCents,
      type: 'expense',
      status: 'posted',
    }, userId)

    await adjustAccountBalance(accountId, userId, -amountInCents)

    const nextMs = frequency === 'weekly'
      ? Date.now() + 7 * 24 * 60 * 60 * 1000
      : Date.now() + 30 * 24 * 60 * 60 * 1000
    const nextDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(nextMs))

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/goals')
    revalidatePath('/dashboard/accounts')
    revalidatePath(`/dashboard/accounts/${accountId}`)
    revalidatePath('/dashboard/transactions')

    return { success: true, id: accountId, nextDate }
  } catch (err) {
    console.error('[setupAutoSaveAction]', err)
    return { success: false, error: 'Auto-save setup failed. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Add funds from cash
// ---------------------------------------------------------------------------

export async function addFundsFromCashAction(raw: {
  accountId: string
  amountDollars: string
  note?: string
}): Promise<ActionResult & { newBalanceInCents?: number }> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    if (!userId) return { success: false, error: 'Not authenticated' }

    const amountInCents = Math.round(parseFloat(raw.amountDollars) * 100)
    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      return { success: false, error: 'Enter a valid amount greater than 0' }
    }

    const account = await getAccountById(raw.accountId, userId)
    if (!account) return { success: false, error: 'Account not found' }

    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const h = now.getHours(), m = now.getMinutes()
    const ampm = h >= 12 ? 'PM' : 'AM'
    const time = `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`

    await insertTransaction({
      id: crypto.randomUUID(),
      date, time,
      merchant: raw.note?.trim() || 'Cash Deposit',
      category: 'Income',
      accountLabel: `${account.name} ${account.number}`,
      amountInCents,
      type: 'income',
      status: 'posted',
      paymentMethod: 'cash',
    }, userId)

    await adjustAccountBalance(raw.accountId, userId, amountInCents)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/accounts')
    revalidatePath(`/dashboard/accounts/${raw.accountId}`)
    revalidatePath('/dashboard/transactions')

    return { success: true, id: raw.accountId, newBalanceInCents: account.balanceInCents + amountInCents }
  } catch (err) {
    console.error('[addFundsFromCashAction]', err)
    return { success: false, error: 'Could not add funds. Please try again.' }
  }
}
