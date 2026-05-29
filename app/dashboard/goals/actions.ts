'use server'

/**
 * Server actions for the Goals page.
 * All monetary values are stored and operated on in cents (integers only).
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { insertGoal, getGoalById, updateGoal, removeGoal } from '@/lib/data/store'
import { computeGoalPercentage } from '@/lib/calculations'

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

export async function createGoal(formData: FormData): Promise<ActionResult> {
  try {
    const raw = {
      name: formData.get('name'),
      targetInCents: formData.get('targetInCents'),
      monthlyContributionInCents: formData.get('monthlyContributionInCents'),
      icon: formData.get('icon'),
      color: formData.get('color'),
      vibe: formData.get('vibe'),
    }

    const parsed = createGoalSchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: message }
    }

    const { name, targetInCents, monthlyContributionInCents, icon, color, vibe } =
      parsed.data

    // Additional domain constraints
    if (targetInCents > 100_000_000) {
      return { success: false, error: 'Target cannot exceed $1,000,000' }
    }

    const id = crypto.randomUUID()
    const eta = computeEta(targetInCents, monthlyContributionInCents)

    await insertGoal({
      id,
      name,
      currentInCents: 0,
      targetInCents,
      monthlyContributionInCents,
      percentageComplete: 0,
      eta,
      icon,
      color,
      vibe,
    })

    revalidatePath('/dashboard/goals')
    revalidatePath('/dashboard')

    return { success: true, id }
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

    const goal = await getGoalById(id)
    if (!goal) return { success: false, error: 'Goal not found.' }

    const newCurrentInCents = goal.currentInCents + parsedAmount
    const newPercentage = computeGoalPercentage(newCurrentInCents, goal.targetInCents)
    const newEta = computeEta(
      Math.max(0, goal.targetInCents - newCurrentInCents),
      goal.monthlyContributionInCents,
    )

    await updateGoal(id, {
      currentInCents: newCurrentInCents,
      percentageComplete: newPercentage,
      eta: newEta,
    })

    revalidatePath('/dashboard/goals')
    revalidatePath('/dashboard')
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

    const goal = await getGoalById(id)
    if (!goal) return { success: false, error: 'Goal not found.' }

    const remaining = Math.max(0, goal.targetInCents - goal.currentInCents)
    const newEta = computeEta(remaining, parsedCents)

    await updateGoal(id, {
      monthlyContributionInCents: parsedCents,
      eta: newEta,
    })

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
    await removeGoal(id)
    revalidatePath('/dashboard/goals')
    revalidatePath('/dashboard')
    return { success: true, id }
  } catch (err) {
    console.error('[deleteGoal] unexpected error:', err)
    return { success: false, error: 'Failed to delete goal. Please try again.' }
  }
}
