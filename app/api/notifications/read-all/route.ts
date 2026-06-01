import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { markAllNotificationsRead } from '@/lib/data/store'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }
    const userId = (session.user as { id?: string }).id ?? ''
    const body = await req.json() as { ids: string[] }
    await markAllNotificationsRead(userId, body.ids ?? [])
    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (error) {
    console.error('[POST /api/notifications/read-all]', error)
    return NextResponse.json(
      { data: null, error: { message: 'Failed to mark all notifications read', code: 'NOTIFICATION_READ_ALL_ERROR' } },
      { status: 500 },
    )
  }
}
