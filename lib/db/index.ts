/**
 * SQLite database connection via @libsql/client + Drizzle ORM.
 * Uses the file: URL scheme to open a local SQLite file (assetly.db at project root).
 * @libsql/client ships WASM — no native compilation required.
 * Tables are created on first import using CREATE TABLE IF NOT EXISTS.
 */

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'
import path from 'path'

// ---------------------------------------------------------------------------
// Open database
// ---------------------------------------------------------------------------

// Resolve absolute path to project root regardless of cwd at runtime
const DB_PATH = path.join(process.cwd(), 'assetly.db')

const client = createClient({
  url: `file:${DB_PATH}`,
})

// ---------------------------------------------------------------------------
// Drizzle instance
// ---------------------------------------------------------------------------

export const db = drizzle(client, { schema })

// ---------------------------------------------------------------------------
// Create tables (idempotent — safe to call on every import)
// ---------------------------------------------------------------------------

async function initTables(): Promise<void> {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      merchant TEXT NOT NULL,
      category TEXT NOT NULL,
      account_label TEXT NOT NULL,
      amount_in_cents INTEGER NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      number TEXT NOT NULL,
      balance_in_cents INTEGER NOT NULL,
      week_delta_in_cents INTEGER NOT NULL,
      type TEXT NOT NULL,
      color TEXT NOT NULL,
      apy_bps INTEGER,
      routing_number TEXT,
      linked_since TEXT NOT NULL,
      last_sync TEXT NOT NULL,
      balance_history TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      limit_in_cents INTEGER NOT NULL,
      spent_in_cents INTEGER NOT NULL,
      percentage_used REAL NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_over INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      current_in_cents INTEGER NOT NULL,
      target_in_cents INTEGER NOT NULL,
      monthly_contribution_in_cents INTEGER NOT NULL,
      percentage_complete REAL NOT NULL,
      eta TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      vibe TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount_in_cents INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      due_in_days INTEGER NOT NULL,
      is_auto_pay INTEGER NOT NULL,
      is_urgent INTEGER NOT NULL,
      category TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount_monthly_in_cents INTEGER NOT NULL,
      next_date TEXT NOT NULL,
      is_used INTEGER NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      glyph TEXT NOT NULL,
      tag TEXT NOT NULL,
      tone TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      cta TEXT NOT NULL,
      is_pinned INTEGER NOT NULL,
      sparkline_data TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)
}

// ---------------------------------------------------------------------------
// Seed on first run
// ---------------------------------------------------------------------------

// Module-level promise so init + seed runs exactly once per process lifetime.
let initPromise: Promise<void> | null = null

export function ensureDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await initTables()
      const { runSeed } = await import('./seed')
      await runSeed()
    })()
  }
  return initPromise
}

// Start initialisation immediately so it's ready when the first request arrives.
void ensureDb()
