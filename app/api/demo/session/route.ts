import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import {
  cleanupExpiredDemoUsers,
  createDemoUser,
  insertAccount,
  insertTransaction,
  insertBudget,
  insertGoal,
  insertBill,
  insertSubscription,
} from '@/lib/data/store'
import {
  accounts as seedAccounts,
  transactions as seedTransactions,
  budgets as seedBudgets,
  goals as seedGoals,
  bills as seedBills,
  subscriptions as seedSubscriptions,
} from '@/lib/data/seed-data'

export function signDemoToken(userId: string, expiresAt: string): string {
  return createHmac('sha256', process.env.DEMO_TOKEN_SECRET!)
    .update(`${userId}|${expiresAt}`)
    .digest('hex')
}

export async function POST() {
  try {
    await cleanupExpiredDemoUsers()

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const userId = await createDemoUser(expiresAt)

    await Promise.all([
      ...seedAccounts.map((a) => insertAccount({ ...a, id: crypto.randomUUID() }, userId)),
      ...seedBudgets.map((b) => insertBudget({ ...b, id: crypto.randomUUID() }, userId)),
      ...seedGoals.map((g) => insertGoal({ ...g, id: crypto.randomUUID() }, userId)),
      ...seedBills.map((b) => insertBill({ ...b, id: crypto.randomUUID() }, userId)),
      ...seedSubscriptions.map((s) => insertSubscription({ ...s, id: crypto.randomUUID() }, userId)),
      ...seedTransactions.map((t) => insertTransaction({ ...t, id: crypto.randomUUID() }, userId)),
    ])

    const demoToken = signDemoToken(userId, expiresAt)
    return NextResponse.json({ userId, demoToken, expiresAt })
  } catch (err) {
    console.error('Demo session creation failed:', err)
    return NextResponse.json({ error: 'Failed to create demo session' }, { status: 500 })
  }
}
