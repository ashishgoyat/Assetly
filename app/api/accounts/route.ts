import { ok, err } from '@/lib/api-response'
import { getAccounts } from '@/lib/data/store'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    const userId = (session?.user as { id?: string })?.id ?? ''
    const accountList = await getAccounts(userId)
    return ok(accountList)
  } catch (error) {
    console.error('[GET /api/accounts]', error)
    return err('Failed to load accounts', 'ACCOUNTS_ERROR', 500)
  }
}
