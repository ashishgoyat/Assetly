import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!, { max: 1 })

export const db = drizzle(client, { schema })

// No-op — kept for compatibility since store.ts calls ensureDb() before every query
export async function ensureDb(): Promise<void> {}
