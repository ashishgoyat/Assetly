import { ok, err } from '@/lib/api-response'
import { getNotifications } from '@/lib/data/store'

export async function GET() {
  try {
    const notifications = await getNotifications()
    return ok(notifications)
  } catch (error) {
    console.error('[GET /api/notifications]', error)
    return err('Failed to load notifications', 'NOTIFICATIONS_ERROR', 500)
  }
}
