'use server'

/**
 * Server actions for the settings page.
 * Profile name/currency/timezone are persisted in the users table and cookies.
 * Password/2FA logic removed — authentication is now Google OAuth only.
 */

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { auth, signOut } from '@/auth'
import {
  getUserById,
  updateUser,
  removeUser,
  incrementSessionVersion,
  clearUserSessions,
  deleteUserSession,
  getTransactions,
  getAccounts,
  getBudgets,
  getGoals,
  getBills,
  getSubscriptions,
  generateNotifications,
  recordEmailedNotification,
  clearAllUserData,
} from '@/lib/data/store'
import { db, ensureDb } from '@/lib/db/index'
import { notificationEmailsSentTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { sendNotificationEmail } from '@/lib/email'
import { getNotificationPrefsServer } from '@/lib/server-prefs'
import type { NotificationPreferences } from '@/contracts/api-contracts'

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
// deleteAccount — no password required (Google OAuth account)
// ---------------------------------------------------------------------------

export async function deleteAccount(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = getSessionUserId(session)
    if (!userId) return { success: false, error: 'Not authenticated' }

    const user = await getUserById(userId)
    if (!user) return { success: false, error: 'User not found' }

    await removeUser(userId)

    // Clear all assetly preference cookies.
    await clearPrefCookie('assetly-currency')
    await clearPrefCookie('assetly-timezone')

    await signOut({ redirect: false })

    return { success: true, message: 'Account deleted' }
  } catch (error) {
    console.error('[deleteAccount]', error)
    return { success: false, error: 'Failed to delete account' }
  }
}

// ---------------------------------------------------------------------------
// signOutAllSessions — increment sessionVersion to invalidate all JWTs
// ---------------------------------------------------------------------------

export async function signOutAllSessions(): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = getSessionUserId(session)
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }
    await incrementSessionVersion(userId)
    await clearUserSessions(userId)
    await signOut({ redirect: false })
    return { success: true, message: 'Signed out of all sessions' }
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
        getTransactions(userId),
        getAccounts(userId),
        getBudgets(userId),
        getGoals(userId),
        getBills(userId),
        getSubscriptions(userId),
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
// clearAllData — wipe transactions, bills, subscriptions, and goals
// ---------------------------------------------------------------------------

export async function clearAllData(): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = getSessionUserId(session)
    if (!userId) return { success: false, error: 'Not authenticated' }

    await clearAllUserData(userId)
    revalidatePath('/dashboard', 'layout')

    return { success: true, message: 'All data cleared' }
  } catch (error) {
    console.error('[clearAllData]', error)
    return { success: false, error: 'Failed to clear data' }
  }
}

// ---------------------------------------------------------------------------
// updateNotificationPrefs — persist notification toggle state as JSON cookie
// ---------------------------------------------------------------------------

const NotificationPrefsSchema = z.object({
  billsDue: z.boolean(),
  budgetExceeded: z.boolean(),
  largeTransactions: z.boolean(),
  weeklyDigest: z.boolean(),
  goalMilestones: z.boolean(),
})

export async function updateNotificationPrefs(
  prefs: NotificationPreferences,
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = getSessionUserId(session)
    if (!userId) return { success: false, error: 'Not authenticated' }

    const parsed = NotificationPrefsSchema.safeParse(prefs)
    if (!parsed.success) {
      return { success: false, error: 'Invalid notification preferences' }
    }

    const cookieStore = await cookies()
    cookieStore.set('assetly-notif-prefs', JSON.stringify(parsed.data), {
      path: '/',
      maxAge: ONE_YEAR_SECONDS,
      httpOnly: false, // needs to be readable client-side if needed
      sameSite: 'lax',
    })
    revalidatePath('/dashboard/settings')

    return { success: true, message: 'Notification preferences updated' }
  } catch (error) {
    console.error('[updateNotificationPrefs]', error)
    return { success: false, error: 'Failed to update notification preferences' }
  }
}

// ---------------------------------------------------------------------------
// sendTestNotificationEmail — force-sends all current notifications via email
// ---------------------------------------------------------------------------

export async function sendTestNotificationEmail(): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = getSessionUserId(session)
    if (!userId) return { success: false, error: 'Not authenticated' }

    const toEmail = process.env.NOTIFICATION_EMAIL ?? ''
    if (!toEmail) return { success: false, error: 'NOTIFICATION_EMAIL not configured' }

    const prefs = await getNotificationPrefsServer()
    const notifications = await generateNotifications(userId, prefs)

    if (notifications.length === 0) {
      return { success: false, error: 'No active notifications to send. Try adding a bill due within 3 days, exceeding a budget, or adding a large transaction.' }
    }

    // Clear emailed history so everything re-sends
    await ensureDb()
    await db.delete(notificationEmailsSentTable).where(eq(notificationEmailsSentTable.userId, userId))

    let sent = 0
    for (const n of notifications) {
      await sendNotificationEmail(n, toEmail)
      await recordEmailedNotification(userId, n.id)
      sent++
    }

    return { success: true, message: `Sent ${sent} notification email${sent !== 1 ? 's' : ''} to ${toEmail}` }
  } catch (error) {
    console.error('[sendTestNotificationEmail]', error)
    return { success: false, error: 'Failed to send test email' }
  }
}

// ---------------------------------------------------------------------------
// updatePassword — stub: passwords removed, auth is Google OAuth only
// ---------------------------------------------------------------------------

export async function updatePassword(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionResult> {
  return { success: false, error: 'Password login is no longer supported. Please use Google sign-in.' }
}

// ---------------------------------------------------------------------------
// revokeSession — delete a single session by ID (user can only delete own)
// ---------------------------------------------------------------------------

export async function revokeSession(sessionId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    const userId = getSessionUserId(session)
    if (!userId) return { success: false, error: 'Not authenticated' }
    if (!sessionId) return { success: false, error: 'Invalid session ID' }
    await deleteUserSession(sessionId, userId)
    return { success: true }
  } catch (error) {
    console.error('[revokeSession]', error)
    return { success: false, error: 'Failed to revoke session' }
  }
}

// ---------------------------------------------------------------------------
// toggle2FA — stub: 2FA removed, auth is Google OAuth only
// ---------------------------------------------------------------------------

export async function toggle2FA(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionResult> {
  return { success: false, error: 'Two-factor authentication is managed by your Google account.' }
}
