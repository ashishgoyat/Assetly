import { ok, err } from '@/lib/api-response'
import { getAccounts } from '@/lib/data/store'

export async function GET() {
  try {
    const accountList = await getAccounts()
    return ok(accountList)
  } catch (error) {
    console.error('[GET /api/accounts]', error)
    return err('Failed to load accounts', 'ACCOUNTS_ERROR', 500)
  }
}
