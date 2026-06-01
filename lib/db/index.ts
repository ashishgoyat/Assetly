/**
 * SQLite database connection via @libsql/client + Drizzle ORM.
 * Uses the file: URL scheme to open a local SQLite file (assetly.db at project root).
 * @libsql/client ships WASM — no native compilation required.
 * Tables are created on first import using CREATE TABLE IF NOT EXISTS.
 */

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'
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

// ---------------------------------------------------------------------------
// Migrate users table to new schema (nullable password_hash + new columns)
// SQLite cannot ALTER COLUMN to remove NOT NULL, so we use the rename pattern.
// ---------------------------------------------------------------------------

async function migrateUsersTable(): Promise<void> {
  // Check if users table exists with the old schema (password_hash NOT NULL)
  // by looking at the table info — if google_id column is absent, migration needed.
  const tableInfo = await client.execute(`PRAGMA table_info(users)`)
  const columns = tableInfo.rows.map((r) => r[1] as string) // column name is index 1
  if (columns.includes('google_id')) {
    // Already migrated — just ensure session_version column exists
    if (!columns.includes('session_version')) {
      await client.execute(
        `ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0`,
      )
    }
    if (!columns.includes('avatar_url')) {
      await client.execute(`ALTER TABLE users ADD COLUMN avatar_url TEXT`)
    }
    return
  }

  if (!columns.includes('users') && columns.length === 0) {
    // Table doesn't exist yet — CREATE TABLE IF NOT EXISTS will handle it
    return
  }

  // Table exists with old schema — reconstruct it
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users_new (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      google_id TEXT,
      avatar_url TEXT,
      session_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    INSERT INTO users_new (id, name, email, password_hash, created_at)
      SELECT id, name, email, password_hash, created_at FROM users;
    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
  `)
}

async function addColumnIfMissing(table: string, column: string, definition: string): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`))
  } catch {
    // column already exists — ignore
  }
}

async function initTables(): Promise<void> {
  // Run users migration before creating tables so the CREATE IF NOT EXISTS
  // for users gets the new schema if the table is absent, or migration runs
  // if it exists with the old schema.
  await migrateUsersTable()

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
      password_hash TEXT,
      google_id TEXT,
      avatar_url TEXT,
      session_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_reads (
      user_id TEXT NOT NULL,
      notification_id TEXT NOT NULL,
      read_at TEXT NOT NULL,
      PRIMARY KEY (user_id, notification_id)
    );

    CREATE TABLE IF NOT EXISTS notification_emails_sent (
      user_id TEXT NOT NULL,
      notification_id TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      PRIMARY KEY (user_id, notification_id)
    );
  `)

  // Add user_id column to existing tables (safe — ignores if already present)
  await addColumnIfMissing('transactions', 'user_id', 'TEXT')
  await addColumnIfMissing('accounts', 'user_id', 'TEXT')
  await addColumnIfMissing('budgets', 'user_id', 'TEXT')
  await addColumnIfMissing('goals', 'user_id', 'TEXT')
  await addColumnIfMissing('bills', 'user_id', 'TEXT')
  await addColumnIfMissing('subscriptions', 'user_id', 'TEXT')
}

// Module-level promise so init runs exactly once per process lifetime.
let initPromise: Promise<void> | null = null

export function ensureDb(): Promise<void> {
  if (!initPromise) {
    initPromise = initTables()
  }
  return initPromise
}

// Start initialisation immediately so it's ready when the first request arrives.
void ensureDb()
