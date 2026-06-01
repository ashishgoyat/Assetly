/**
 * Signup page — Server Component.
 * Google OAuth handles new user creation — redirect to /login.
 */

import { redirect } from 'next/navigation'

export default function SignupPage() {
  redirect('/login')
}
