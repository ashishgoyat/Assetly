import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateNotifications, getEmailedNotifications, recordEmailedNotification } from '@/lib/data/store'
import { db, ensureDb } from '@/lib/db/index'
import { notificationEmailsSentTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { sendNotificationEmail } from '@/lib/email'
import { getNotificationPrefsServer } from '@/lib/server-prefs'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const secret = url.searchParams.get('secret')
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = (session.user as { id?: string }).id ?? ''
    const toEmail = process.env.NOTIFICATION_EMAIL ?? ''
    const force = url.searchParams.get('force') === 'true'

    const prefs = await getNotificationPrefsServer()
    const notifications = await generateNotifications(userId, prefs)

    // force=true: clear emailed history so all current notifications re-send
    if (force) {
      await ensureDb()
      await db.delete(notificationEmailsSentTable).where(eq(notificationEmailsSentTable.userId, userId))
    }

    const emailed = force ? new Set<string>() : await getEmailedNotifications(userId)

    let sent = 0
    const skipped: string[] = []
    for (const n of notifications) {
      if (!emailed.has(n.id)) {
        await sendNotificationEmail(n, toEmail)
        await recordEmailedNotification(userId, n.id)
        sent++
      } else {
        skipped.push(n.id)
      }
    }

    return NextResponse.json({
      data: { sent, skipped: skipped.length, generated: notifications.length, force },
      error: null,
    })
  } catch (error) {
    console.error('[GET /api/cron/notifications]', error)
    return NextResponse.json(
      { data: null, error: { message: 'Cron job failed', code: 'CRON_ERROR' } },
      { status: 500 },
    )
  }
}
