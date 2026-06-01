import { Resend } from 'resend'
import type { Notification } from '@/contracts/api-contracts'

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
