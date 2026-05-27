'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export type ActionResult = { error: string } | undefined

export async function login(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/dashboard',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Invalid email or password' }
    }
    throw error // NEXT_REDIRECT — must re-throw
  }
}
