/**
 * Server-side helpers for reading user preferences from cookies.
 * Currency, timezone, and 2FA state are stored as cookies (not in the DB schema)
 * so the prefs can be read both server-side via next/headers and client-side
 * via document.cookie without requiring a schema migration.
 */

import { cookies } from 'next/headers'

const VALID_CURRENCIES = ['USD', 'INR', 'EUR'] as const
export type Currency = (typeof VALID_CURRENCIES)[number]

export const DEFAULT_CURRENCY: Currency = 'USD'
export const DEFAULT_TIMEZONE = 'Asia/Kolkata'

export async function getCurrencyServer(): Promise<Currency> {
  const c = (await cookies()).get('assetly-currency')?.value
  return (VALID_CURRENCIES as readonly string[]).includes(c ?? '')
    ? (c as Currency)
    : DEFAULT_CURRENCY
}

export async function getTimezoneServer(): Promise<string> {
  return (await cookies()).get('assetly-timezone')?.value ?? DEFAULT_TIMEZONE
}

export async function getTwoFactorEnabledServer(): Promise<boolean> {
  return (await cookies()).get('assetly-2fa')?.value === 'true'
}
