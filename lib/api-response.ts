/**
 * Typed response helpers for API route handlers.
 * Every response is wrapped in { data, error } envelope per contracts/api-contracts.ts.
 */

import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/contracts/api-contracts'

export function ok<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, error: null })
}

export function err(
  message: string,
  code: string,
  status = 400,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { data: null, error: { message, code } },
    { status },
  )
}
