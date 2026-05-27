'use server'

import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createUser, getUserByEmail } from '@/lib/data/store'
import { signIn } from '@/auth'

export type ActionResult = { error: string } | undefined

const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(80),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export async function signup(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, email, password } = parsed.data

  const existing = await getUserByEmail(email)
  if (existing) return { error: 'An account with this email already exists' }

  const passwordHash = await bcrypt.hash(password, 12)
  await createUser({
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  })

  await signIn('credentials', { email, password, redirectTo: '/dashboard' })
  // signIn throws NEXT_REDIRECT — never reaches here
}
