import { Resend } from 'resend'
import type { Notification } from '@/contracts/api-contracts'
import {
  generateNotifications,
  getEmailedNotifications,
  recordEmailedNotification,
  getUserById,
} from '@/lib/data/store'
import { getNotificationPrefsServer } from '@/lib/server-prefs'

// Lazy-initialize Resend so the absence of RESEND_API_KEY at build time
// doesn't throw during static page data collection.
function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY environment variable is not set')
  return new Resend(key)
}

export async function sendNotificationEmail(notification: Notification, toEmail: string): Promise<void> {
  const resend = getResend()
  const subjects: Record<string, string> = {
    bill_due: 'Bill Due Soon — Assetly',
    budget_exceeded: 'Budget Exceeded — Assetly',
    large_transaction: 'Large Transaction Detected — Assetly',
    goal_milestone: 'Goal Milestone Reached — Assetly',
    weekly_digest: 'Weekly Digest — Assetly',
  }
  await resend.emails.send({
    from: 'Assetly <onboarding@resend.dev>',
    to: [toEmail],
    subject: subjects[notification.type] ?? 'Assetly Notification',
    text: `${notification.title}\n\n${notification.body}${notification.route ? `\n\nOpen: ${notification.route}` : ''}`,
  })
}

/**
 * Generates all current notifications for the user, sends emails for any that
 * haven't been emailed yet, and records them. Silently swallows errors so a
 * failed email never breaks the calling server action.
 * Intended to be called inside Next.js `after()` so it runs after the response.
 */
export async function sendPendingNotificationEmails(userId: string): Promise<void> {
  try {
    const user = await getUserById(userId)
    if (!user?.email) return

    const prefs = await getNotificationPrefsServer()
    const notifications = await generateNotifications(userId, prefs)
    const emailed = await getEmailedNotifications(userId)

    for (const n of notifications) {
      if (!emailed.has(n.id)) {
        await sendNotificationEmail(n, user.email)
        await recordEmailedNotification(userId, n.id)
      }
    }
  } catch (err) {
    // Intentionally swallowed — email failure must not surface to the user.
    console.error('[sendPendingNotificationEmails] error:', err)
  }
}
