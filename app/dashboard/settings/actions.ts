'use server'

/**
 * Server actions for the settings page.
 * Profile name/email/password are persisted in the users table.
 * Currency, timezone, 2FA, and last-password-change date are persisted
 * as cookies — no schema migration needed.
 */

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { auth, signOut } from '@/auth'
import {
  getUserById,
  updateUser,
  removeUser,
  getTransactions,
  getAccounts,
  getBudgets,
  getGoals,
  getBills,
  getSubscriptions,
} from '@/lib/data/store'

// ---------------------------------------------------------------------------
// Shared types and helpers
// ---------------------------------------------------------------------------

type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string }

function val(fd: FormData, key: string): string | undefined {
  const v = fd.get(key)
  return typeof v === 'string' ? v : undefined
}

const VALID_CURRENCIES = ['USD', 'INR', 'EUR'] as const

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

async function setPrefCookie(name: string, value: string): Promise<void> {
  ;(await cookies()).set(name, value, {
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
  })
}

async function clearPrefCookie(name: string): Promise<void> {
  ;(await cookies()).set(name, '', { path: '/', maxAge: 0 })
}

function getSessionUserId(
  session: { user?: { id?: string } | null } | null,
): string | null {
  if (!session?.user) return null
  const id = (session.user as { id?: string }).id
  return typeof id === 'string' && id.length > 0 ? id : null
}

// ---------------------------------------------------------------------------
// updateProfile — name + currency + timezone
// ---------------------------------------------------------------------------

const UpdateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name is too long'),
  currency: z.enum(VALID_CURRENCIES),
  timezone: z.string().trim().min(1, 'Timezone is required').max(80),
})

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = getSessionUserId(session)
    if (!userId) return { success: false, error: 'Not authenticated' }

    const parsed = UpdateProfileSchema.safeParse({
      name: val(formData, 'name'),
      currency: val(formData, 'currency'),
      timezone: val(formData, 'timezone'),
    })

    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return {
        success: false,
        error: first?.message ?? 'Invalid profile data',
      }
    }

    const { name, currency, timezone } = parsed.data

    await updateUser(userId, { name })
    await setPrefCookie('assetly-currency', currency)
    await setPrefCookie('assetly-timezone', timezone)

    revalidatePath('/dashboard', 'layout')

    return { success: true, message: 'Profile updated' }
  } catch (error) {
    console.error('[updateProfile]', error)
    return { success: false, error: 'Failed to update profile' }
  }
}

// ---------------------------------------------------------------------------
// updatePassword — current + new
// ---------------------------------------------------------------------------

const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password is too long'),
})

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = getSessionUserId(session)
    if (!userId) return { success: false, error: 'Not authenticated' }

    const parsed = UpdatePasswordSchema.safeParse({
      currentPassword: val(formData, 'currentPassword'),
      newPassword: val(formData, 'newPassword'),
    })

    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return {
        success: false,
        error: first?.message ?? 'Invalid password input',
      }
    }

    const user = await getUserById(userId)
    if (!user) return { success: false, error: 'User not found' }

    const valid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.passwordHash,
    )
    if (!valid) {
      return { success: false, error: 'Current password is incorrect' }
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 10)
    await updateUser(userId, { passwordHash: newHash })

    const today = new Date().toISOString().slice(0, 10)
    await setPrefCookie('assetly-last-password-change', today)

    revalidatePath('/dashboard/settings')

    return { success: true, message: 'Password updated' }
  } catch (error) {
    console.error('[updatePassword]', error)
    return { success: false, error: 'Failed to update password' }
  }
}

// ---------------------------------------------------------------------------
// deleteAccount — requires password confirmation
// ---------------------------------------------------------------------------

const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

export async function deleteAccount(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = getSessionUserId(session)
    if (!userId) return { success: false, error: 'Not authenticated' }

    const parsed = DeleteAccountSchema.safeParse({
      password: val(formData, 'password'),
    })
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return { success: false, error: first?.message ?? 'Invalid input' }
    }

    const user = await getUserById(userId)
    if (!user) return { success: false, error: 'User not found' }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
    if (!valid) {
      return { success: false, error: 'Password is incorrect' }
    }

    await removeUser(userId)

    // Clear all assetly cookies so the next visit starts fresh.
    await clearPrefCookie('assetly-currency')
    await clearPrefCookie('assetly-timezone')
    await clearPrefCookie('assetly-2fa')
    await clearPrefCookie('assetly-last-password-change')

    await signOut({ redirect: false })

    return { success: true, message: 'Account deleted' }
  } catch (error) {
    console.error('[deleteAccount]', error)
    return { success: false, error: 'Failed to delete account' }
  }
}

// ---------------------------------------------------------------------------
// signOutAllSessions — JWT sessions can't be revoked individually,
// so we just sign the current session out.
// ---------------------------------------------------------------------------

export async function signOutAllSessions(): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }
    await signOut({ redirect: false })
    return { success: true, message: 'Signed out' }
  } catch (error) {
    console.error('[signOutAllSessions]', error)
    return { success: false, error: 'Failed to sign out' }
  }
}

// ---------------------------------------------------------------------------
// exportUserData — bundle every owned record into a JSON string
// ---------------------------------------------------------------------------

type ExportResult =
  | { success: true; data: string }
  | { success: false; error: string }

export async function exportUserData(): Promise<ExportResult> {
  try {
    const session = await auth()
    const userId = getSessionUserId(session)
    if (!userId) return { success: false, error: 'Not authenticated' }

    const user = await getUserById(userId)
    if (!user) return { success: false, error: 'User not found' }

    const [transactions, accounts, budgets, goals, bills, subscriptions] =
      await Promise.all([
        getTransactions(),
        getAccounts(),
        getBudgets(),
        getGoals(),
        getBills(),
        getSubscriptions(),
      ])

    const payload = {
      exportedAt: new Date().toISOString(),
      profile: {
        name: user.name,
        email: user.email,
      },
      transactions,
      accounts,
      budgets,
      goals,
      bills,
      subscriptions,
    }

    return { success: true, data: JSON.stringify(payload, null, 2) }
  } catch (error) {
    console.error('[exportUserData]', error)
    return { success: false, error: 'Failed to export data' }
  }
}

// ---------------------------------------------------------------------------
// toggle2FA — cookie-backed flag
// ---------------------------------------------------------------------------

const Toggle2FASchema = z.object({
  enabled: z.enum(['true', 'false']),
})

export async function toggle2FA(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = getSessionUserId(session)
    if (!userId) return { success: false, error: 'Not authenticated' }

    const parsed = Toggle2FASchema.safeParse({
      enabled: val(formData, 'enabled'),
    })
    if (!parsed.success) {
      return { success: false, error: 'Invalid value' }
    }

    await setPrefCookie('assetly-2fa', parsed.data.enabled)
    revalidatePath('/dashboard/settings')

    return {
      success: true,
      message:
        parsed.data.enabled === 'true'
          ? 'Two-factor authentication enabled'
          : 'Two-factor authentication disabled',
    }
  } catch (error) {
    console.error('[toggle2FA]', error)
    return { success: false, error: 'Failed to update 2FA' }
  }
}
