import { ok, err } from '@/lib/api-response'
import { getInsights } from '@/lib/data/store'

export async function GET() {
  try {
    const insightList = await getInsights()
    return ok(insightList)
  } catch (error) {
    console.error('[GET /api/insights]', error)
    return err('Failed to load insights', 'INSIGHTS_ERROR', 500)
  }
}
