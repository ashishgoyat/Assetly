'use server'

/**
 * Signup action stub — account creation is now handled by Google OAuth.
 * This file is kept to satisfy the existing signup page import until
 * the page is updated to use the OAuth sign-in flow.
 */

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export type ActionResult = { error?: string } | undefined

export async function signup(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: ActionResult,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionResult> {
  try {
    await signIn('google', { redirectTo: '/dashboard' })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Sign up failed. Please try again.' }
    }
    throw error
  }
}
