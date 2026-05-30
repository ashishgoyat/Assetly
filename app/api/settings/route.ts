import { cookies } from 'next/headers'
import { ok, err } from '@/lib/api-response'
import { auth } from '@/auth'
import { getUserById } from '@/lib/data/store'
import {
  getCurrencyServer,
  getTimezoneServer,
  getTwoFactorEnabledServer,
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

    // Try to read the latest name/email from the DB so a freshly updated
    // profile shows up immediately, even before the session JWT is refreshed.
    let name = session.user.name ?? 'You'
    let email = session.user.email ?? ''
    if (userId) {
      const row = await getUserById(userId)
      if (row) {
        name = row.name
        email = row.email
      }
    }

    const [currency, timezone, twoFactorEnabled] = await Promise.all([
      getCurrencyServer(),
      getTimezoneServer(),
      getTwoFactorEnabledServer(),
    ])

    const lastPasswordChange =
      (await cookies()).get('assetly-last-password-change')?.value ??
      '2025-01-15'

    const settings: UserSettings = {
      profile: {
        name,
        email,
        initials: computeInitials(name),
        // The cookie may hold 'USD' | 'INR' | 'EUR'; the contract currently
        // narrows to 'USD' | 'INR'. Cast through unknown so EUR still flows
        // through to the client without breaking existing consumers.
        currency: currency as unknown as UserSettings['profile']['currency'],
        timezone,
      },
      notifications: {
        billsDue: true,
        budgetExceeded: true,
        largeTransactions: true,
        weeklyDigest: true,
        goalMilestones: true,
      },
      security: {
        twoFactorEnabled,
        lastPasswordChange,
        activeSessions: 1,
      },
    }

    return ok(settings)
  } catch (error) {
    console.error('[GET /api/settings]', error)
    return err('Failed to load settings', 'SETTINGS_ERROR', 500)
  }
}
