import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateNotifications, getNotificationReads } from '@/lib/data/store'
import { getNotificationPrefsServer } from '@/lib/server-prefs'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    const userId = (session.user as { id?: string }).id ?? ''
    const [readSet, prefs] = await Promise.all([
      getNotificationReads(userId),
      getNotificationPrefsServer(),
    ])
    const notifications = await generateNotifications(userId, prefs)

    const withRead = notifications.map(n => ({ ...n, isRead: readSet.has(n.id) }))
    return NextResponse.json({ data: withRead, error: null })
  } catch (error) {
    console.error('[GET /api/notifications]', error)
    return NextResponse.json(
      { data: null, error: { message: 'Failed to load notifications', code: 'NOTIFICATIONS_ERROR' } },
      { status: 500 },
    )
  }
}
