// One-time migration: encrypt plaintext sensitive fields in the database.
// Run with: node --experimental-strip-types --env-file=.env.local scripts/encrypt-existing-data.ts
//
// Idempotent: rows that are already encrypted are detected via decrypt() returning non-null and skipped.

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import postgres from 'postgres'

// ---------------------------------------------------------------------------
// Inline crypto — avoids @/ path alias issues in Node.js script context
// ---------------------------------------------------------------------------

function loadKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) throw new Error('[crypto] ENCRYPTION_KEY environment variable is not set')
  const key = Buffer.from(raw, 'base64')
  if (key.byteLength !== 32)
    throw new Error(`[crypto] ENCRYPTION_KEY must decode to exactly 32 bytes (got ${key.byteLength})`)
  return key
}

function encrypt(plaintext: string): string {
  const key = loadKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

function decrypt(ciphertext: string): string | null {
  const parts = ciphertext.split(':')
  if (parts.length !== 3) return null
  try {
    const key = loadKey()
    const [ivB64, tagB64, dataB64] = parts
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    return decipher.update(Buffer.from(dataB64, 'base64')).toString('utf8') + decipher.final('utf8')
  } catch {
    return null
  }
}

function needsEncryption(value: string | null): value is string {
  if (value === null) return false
  return decrypt(value) === null // plaintext: decrypt fails → needs encryption
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

const sql = postgres(process.env.DATABASE_URL!)

const BATCH = 100

async function migrateUserSessions() {
  const rows = await sql<{ id: string; ip_address: string | null }[]>`
    SELECT id, ip_address FROM user_sessions WHERE ip_address IS NOT NULL
  `
  let updated = 0
  for (const row of rows) {
    if (needsEncryption(row.ip_address)) {
      await sql`UPDATE user_sessions SET ip_address = ${encrypt(row.ip_address)} WHERE id = ${row.id}`
      updated++
    }
  }
  console.log(`user_sessions.ip_address: ${updated}/${rows.length} rows encrypted`)
}

async function migrateTransactions() {
  let offset = 0
  let totalUpdated = 0
  let totalRows = 0
  while (true) {
    const rows = await sql<{ id: string; note: string | null }[]>`
      SELECT id, note FROM transactions WHERE note IS NOT NULL
      LIMIT ${BATCH} OFFSET ${offset}
    `
    if (rows.length === 0) break
    totalRows += rows.length
    for (const row of rows) {
      if (needsEncryption(row.note)) {
        await sql`UPDATE transactions SET note = ${encrypt(row.note!)} WHERE id = ${row.id}`
        totalUpdated++
      }
    }
    offset += rows.length
    if (rows.length < BATCH) break
  }
  console.log(`transactions.note: ${totalUpdated}/${totalRows} rows encrypted`)
}

async function migrateAccounts() {
  const rows = await sql<{ id: string; number: string; routing_number: string | null }[]>`
    SELECT id, number, routing_number FROM accounts
  `
  let updated = 0
  for (const row of rows) {
    const encryptNumber = needsEncryption(row.number)
    const encryptRouting = needsEncryption(row.routing_number)
    if (encryptNumber || encryptRouting) {
      await sql`
        UPDATE accounts SET
          number = ${encryptNumber ? encrypt(row.number) : row.number},
          routing_number = ${encryptRouting && row.routing_number ? encrypt(row.routing_number) : row.routing_number}
        WHERE id = ${row.id}
      `
      updated++
    }
  }
  console.log(`accounts.number/routing_number: ${updated}/${rows.length} rows encrypted`)
}

async function main() {
  console.log('Starting field-level encryption migration…')
  await migrateUserSessions()
  await migrateTransactions()
  await migrateAccounts()
  console.log('Migration complete.')
  await sql.end()
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
