import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { markNotificationRead } from '@/lib/data/store'

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }
    const userId = (session.user as { id?: string }).id ?? ''
    const { id } = await params
    await markNotificationRead(userId, id)
    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (error) {
    console.error('[PATCH /api/notifications/[id]/read]', error)
    return NextResponse.json(
      { data: null, error: { message: 'Failed to mark notification read', code: 'NOTIFICATION_READ_ERROR' } },
      { status: 500 },
    )
  }
}
