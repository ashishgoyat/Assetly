'use client'

/**
 * Login page — Client Component (needs useActionState for error display)
 */

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from './actions'
import type { ActionResult } from './actions'

const initialState: ActionResult = undefined

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <>
      <div className="mb-6">
        <h1
          className="text-2xl font-semibold tracking-tight mb-1"
          style={{ color: 'var(--ink)' }}
        >
          Welcome back
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
          Sign in to your account
        </p>
      </div>

      <form action={formAction} noValidate>
        <div className="flex flex-col gap-4">
          {/* Email field */}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="field-input"
            />
          </div>

          {/* Password field */}
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="field-input"
            />
          </div>

          {/* Error message */}
          {state?.error && (
            <p
              role="alert"
              className="text-sm font-medium"
              style={{ color: 'var(--neg)' }}
            >
              {state.error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl py-2.5 px-4 text-sm font-semibold text-white transition-opacity mt-2"
            style={{ background: 'var(--accent)' }}
            aria-disabled={isPending}
          >
            {isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>

      {/* Footer link */}
      <p
        className="mt-6 text-center text-sm"
        style={{ color: 'var(--ink-3)' }}
      >
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-semibold"
          style={{ color: 'var(--accent)' }}
        >
          Sign up →
        </Link>
      </p>
    </>
  )
}
