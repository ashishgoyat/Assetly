import { ok, err } from '@/lib/api-response'
import { auth } from '@/auth'
import { getUserById, countActiveSessions, getActiveSessions } from '@/lib/data/store'
import {
  getCurrencyServer,
  getTimezoneServer,
  getNotificationPrefsServer,
} from '@/lib/server-prefs'
import type { UserSettings } from '@/contracts/api-contracts'

/**
 * Computes initials from a full name.
 * "Ashish Goyat" -> "AG", "alice" -> "A", "" -> "?"
 */
function computeInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return initials || '?'
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return err('Not authenticated', 'UNAUTHORIZED', 401)
    }

    // The JWT callback sets token.id, which the session callback copies onto
    // session.user.id. The default NextAuth types don't expose .id, so we cast.
    const userId = (session.user as { id?: string }).id

    // Read the latest name/email/avatarUrl from the DB so a freshly updated
    // profile shows up immediately, even before the session JWT is refreshed.
    let name = session.user.name ?? 'You'
    let email = session.user.email ?? ''
    let avatarUrl = (session.user as { avatarUrl?: string }).avatarUrl ?? ''
    if (userId) {
      const row = await getUserById(userId)
      if (row) {
        name = row.name
        email = row.email
        avatarUrl = row.avatarUrl ?? ''
      }
    }

    const [currency, timezone, notifPrefs, sessionCount, sessions] = await Promise.all([
      getCurrencyServer(),
      getTimezoneServer(),
      getNotificationPrefsServer(),
      userId ? countActiveSessions(userId) : Promise.resolve(1),
      userId ? getActiveSessions(userId) : Promise.resolve([]),
    ])

    const settings: UserSettings = {
      profile: {
        name,
        email,
        initials: computeInitials(name),
        avatarUrl,
        // The cookie may hold 'USD' | 'INR' | 'EUR'; cast through unknown so
        // EUR still flows through to the client without breaking consumers.
        currency: currency as unknown as UserSettings['profile']['currency'],
        timezone,
      },
      notifications: notifPrefs,
      security: {
        activeSessions: sessionCount,
        twoFactorEnabled: false,   // Deprecated — always false with Google OAuth
        lastPasswordChange: '',    // Deprecated — always empty with Google OAuth
        sessions,
      },
    }

    return ok(settings)
  } catch (error) {
    console.error('[GET /api/settings]', error)
    return err('Failed to load settings', 'SETTINGS_ERROR', 500)
  }
}
