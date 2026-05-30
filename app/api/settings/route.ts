import { ok, err } from '@/lib/api-response'
import { auth } from '@/auth'
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

    const name = session.user.name ?? 'You'
    const email = session.user.email ?? ''

    const settings: UserSettings = {
      profile: {
        name,
        email,
        initials: computeInitials(name),
        currency: 'USD',
        timezone: 'Asia/Kolkata',
      },
      notifications: {
        billsDue: true,
        budgetExceeded: true,
        largeTransactions: true,
        weeklyDigest: true,
        goalMilestones: true,
      },
      security: {
        twoFactorEnabled: false,
        lastPasswordChange: '2025-01-15',
        activeSessions: 1,
      },
    }

    return ok(settings)
  } catch (error) {
    console.error('[GET /api/settings]', error)
    return err('Failed to load settings', 'SETTINGS_ERROR', 500)
  }
}
