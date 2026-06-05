import { auth } from '@/auth'
import { ok, err } from '@/lib/api-response'
import { getActiveSessions } from '@/lib/data/store'

export async function GET() {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    if (!userId) return err('Unauthorized', 'UNAUTHORIZED', 401)

    const sessions = await getActiveSessions(userId)
    return ok(sessions)
  } catch (e) {
    console.error('[GET /api/sessions]', e)
    return err('Failed to load sessions', 'SERVER_ERROR', 500)
  }
}
