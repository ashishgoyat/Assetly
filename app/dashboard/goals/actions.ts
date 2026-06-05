'use server'

/**
 * Server actions for the Goals page.
 * All monetary values are stored and operated on in cents (integers only).
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { insertGoal, getGoalById, updateGoal, removeGoal, insertTransaction, getGoals } from '@/lib/data/store'
import { computeGoalPercentage } from '@/lib/calculations'
import { auth } from '@/auth'
import type { Goal } from '@/contracts/api-contracts'
import { getCurrencyServer, getExchangeRateServer } from '@/lib/server-prefs'

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

type ActionResult = { success: true; id: string } | { success: false; error: string }
type CreateGoalResult = { success: true; id: string; goal: Goal } | { success: false; error: string }

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

const VALID_ICONS = ['lock', 'flag', 'card', 'heart', 'spark', 'goal'] as const
type GoalIcon = (typeof VALID_ICONS)[number]

const createGoalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80, 'Name must be 80 characters or fewer'),
  targetInCents: dollarsToCents,
  monthlyContributionInCents: dollarsToCents,
  icon: z
    .string()
    .optional()
    .transform((v): GoalIcon => {
      const candidate = v ?? ''
      return (VALID_ICONS as readonly string[]).includes(candidate)
        ? (candidate as GoalIcon)
        : 'goal'
    }),
  color: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : 'var(--cat-2)')),
  vibe: z
    .string()
    .optional()
    .transform((v) => v ?? ''),
})

// ---------------------------------------------------------------------------
// ETA computation
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

/**
 * Estimates the month when the goal will be fully funded.
 * monthsNeeded = ceil(remainingInCents / monthlyContributionInCents)
 * Returns a string like "Aug 2026".
 */
function computeEta(
  remainingInCents: number,
  monthlyContributionInCents: number,
): string {
  const monthsNeeded = Math.ceil(remainingInCents / monthlyContributionInCents)
  const now = new Date()
  const etaDate = new Date(now.getFullYear(), now.getMonth() + monthsNeeded, 1)
  return `${MONTH_NAMES[etaDate.getMonth()]} ${etaDate.getFullYear()}`
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export async function createGoal(formData: FormData): Promise<CreateGoalResult> {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const [currency, existingGoals] = await Promise.all([
      getCurrencyServer(),
      getGoals(userId),
    ])
    const rate = await getExchangeRateServer(currency)

    const raw = {
      name: val(formData, 'name'),
      targetInCents: val(formData, 'targetInCents'),
      monthlyContributionInCents: val(formData, 'monthlyContributionInCents'),
      icon: val(formData, 'icon'),
      color: val(formData, 'color'),
      vibe: val(formData, 'vibe'),
    }

    const parsed = createGoalSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: message }
    }

    const { name, icon, color, vibe } = parsed.data

    const duplicate = existingGoals.find(g =>
      g.name.trim().toLowerCase() === name.trim().toLowerCase()
    )
    if (duplicate) {
      return { success: false, error: `A goal named "${name}" already exists.` }
    }

    const targetBaseCents = Math.round(parsed.data.targetInCents / rate)
    const monthlyBaseCents = Math.round(parsed.data.monthlyContributionInCents / rate)

    // Additional domain constraints
    if (targetBaseCents > 1_000_000_00) {
      return { success: false, error: 'Target cannot exceed 1,000,000' }
    }

    const id = crypto.randomUUID()
    const eta = computeEta(targetBaseCents, monthlyBaseCents)

    await insertGoal({
      id,
      name,
      currentInCents: 0,
      targetInCents: targetBaseCents,
      monthlyContributionInCents: monthlyBaseCents,
      percentageComplete: 0,
      eta,
      icon,
      color,
      vibe,
    }, userId)

    revalidatePath('/dashboard/goals')
    revalidatePath('/dashboard')

    const goal: Goal = {
      id,
      name,
      currentInCents: 0,
      targetInCents: targetBaseCents,
      monthlyContributionInCents: monthlyBaseCents,
      percentageComplete: 0,
      eta,
      icon,
      color,
      vibe,
    }

    return { success: true, id, goal }
  } catch (err) {
    console.error('[createGoal] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function addFundsToGoal(
  id: string,
  amountDollars: string,
): Promise<ActionResult> {
  try {
    const parsedAmount = Math.round(parseFloat(amountDollars) * 100)
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      return { success: false, error: 'Amount must be a positive number.' }
    }

    const currencyS = await getCurrencyServer()
    const rateS = await getExchangeRateServer(currencyS)
    const parsedAmountBase = Math.round(parsedAmount / rateS)

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const goal = await getGoalById(id, userId)
    if (!goal) return { success: false, error: 'Goal not found.' }

    const newCurrentInCents = goal.currentInCents + parsedAmountBase
    const newPercentage = computeGoalPercentage(newCurrentInCents, goal.targetInCents)
    const newEta = computeEta(
      Math.max(0, goal.targetInCents - newCurrentInCents),
      goal.monthlyContributionInCents,
    )

    await updateGoal(id, {
      currentInCents: newCurrentInCents,
      percentageComplete: newPercentage,
      eta: newEta,
    }, userId)

    const now = new Date()
    await insertTransaction({
      id: crypto.randomUUID(),
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      merchant: goal.name,
      category: 'Transfers',
      accountLabel: 'Goal Transfer',
      amountInCents: parsedAmountBase,
      type: 'expense',
      status: 'posted',
    }, userId)

    revalidatePath('/dashboard/goals')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/transactions')
    return { success: true, id }
  } catch (err) {
    console.error('[addFundsToGoal] unexpected error:', err)
    return { success: false, error: 'Failed to add funds. Please try again.' }
  }
}

export async function updateGoalMonthly(
  id: string,
  newMonthlyDollars: string,
): Promise<ActionResult> {
  try {
    const parsedCents = Math.round(parseFloat(newMonthlyDollars) * 100)
    if (!Number.isInteger(parsedCents) || parsedCents <= 0) {
      return { success: false, error: 'Monthly amount must be a positive number.' }
    }

    const currencyS = await getCurrencyServer()
    const rateS = await getExchangeRateServer(currencyS)
    const parsedCentsBase = Math.round(parsedCents / rateS)

    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''

    const goal = await getGoalById(id, userId)
    if (!goal) return { success: false, error: 'Goal not found.' }

    const remaining = Math.max(0, goal.targetInCents - goal.currentInCents)
    const newEta = computeEta(remaining, parsedCentsBase)

    await updateGoal(id, {
      monthlyContributionInCents: parsedCentsBase,
      eta: newEta,
    }, userId)

    revalidatePath('/dashboard/goals')
    revalidatePath('/dashboard')
    return { success: true, id }
  } catch (err) {
    console.error('[updateGoalMonthly] unexpected error:', err)
    return { success: false, error: 'Failed to update monthly amount. Please try again.' }
  }
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  try {
    if (!id) return { success: false, error: 'Invalid goal ID.' }
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    await removeGoal(id, userId)
    revalidatePath('/dashboard/goals')
    revalidatePath('/dashboard')
    return { success: true, id }
  } catch (err) {
    console.error('[deleteGoal] unexpected error:', err)
    return { success: false, error: 'Failed to delete goal. Please try again.' }
  }
}
