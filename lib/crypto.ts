import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

function loadKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) {
    throw new Error('[crypto] ENCRYPTION_KEY environment variable is not set')
  }
  const key = Buffer.from(raw, 'base64')
  if (key.byteLength !== 32) {
    throw new Error(
      `[crypto] ENCRYPTION_KEY must decode to exactly 32 bytes (got ${key.byteLength})`,
    )
  }
  return key
}

export function encrypt(plaintext: string): string
export function encrypt(plaintext: null): null
export function encrypt(plaintext: undefined): undefined
export function encrypt(plaintext: string | null | undefined): string | null | undefined {
  if (plaintext == null) return plaintext
  const key = loadKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decrypt(ciphertext: string): string | null
export function decrypt(ciphertext: null): null
export function decrypt(ciphertext: undefined): undefined
export function decrypt(ciphertext: string | null | undefined): string | null | undefined {
  if (ciphertext == null) return ciphertext
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
