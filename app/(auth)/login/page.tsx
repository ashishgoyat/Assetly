'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [redirecting, setRedirecting] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const demoExpired = searchParams.get('reason') === 'demo-expired'

  function handleGoogleSignIn() {
    setRedirecting(true)
    setError(null)
    signIn('google', { callbackUrl: '/dashboard' }).catch(() => {
      setRedirecting(false)
      setError('Sign-in failed. Please try again.')
    })
  }

  async function handleDemoSignIn() {
    setDemoLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/demo/session', { method: 'POST' })
      if (!res.ok) throw new Error('Server error')
      const { userId, demoToken } = (await res.json()) as { userId: string; demoToken: string }
      await signIn('credentials', { userId, demoToken, callbackUrl: '/dashboard' })
    } catch {
      setDemoLoading(false)
      setError('Could not start demo. Please try again.')
    }
  }

  const busy = redirecting || demoLoading

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div className="text-center">
        <h1
          className="text-xl font-bold tracking-tight mb-1"
          style={{ color: 'var(--ink)' }}
        >
          Welcome back
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
          Sign in to access your financial dashboard
        </p>
      </div>

      {/* Expired demo notice */}
      {demoExpired && (
        <p
          className="text-sm text-center rounded-xl px-4 py-2"
          style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}
        >
          Your demo session expired. Start a new one below or sign in with Google.
        </p>
      )}

      {/* Feature list */}
      <ul className="flex flex-col gap-2">
        {[
          'Track assets, investments & net worth',
          'Set savings goals and monitor budgets',
          'Stay on top of bills and spending',
        ].map((feat) => (
          <li
            key={feat}
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--ink-2)' }}
          >
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            >
              <circle cx="8" cy="8" r="7" fill="var(--pos-soft)" />
              <path
                d="M5 8l2 2 4-4"
                stroke="var(--pos)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {feat}
          </li>
        ))}
      </ul>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)' }} />

      {/* Google Sign In */}
      <button
        type="button"
        disabled={busy}
        aria-disabled={busy}
        aria-busy={redirecting}
        onClick={handleGoogleSignIn}
        className="w-full rounded-xl py-3 px-4 text-sm font-semibold transition-opacity min-h-[44px]"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          background: 'var(--surface-2)',
          color: 'var(--ink)',
          border: '1.5px solid var(--border)',
          opacity: busy ? 0.65 : 1,
          cursor: busy ? 'not-allowed' : 'pointer',
        }}
      >
        {redirecting ? (
          'Redirecting…'
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
              focusable="false"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </>
        )}
      </button>

      {/* Demo sign in */}
      <div className="flex flex-col gap-2">
        <div
          className="flex items-center gap-3 text-xs"
          style={{ color: 'var(--ink-4)' }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          or
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <button
          type="button"
          disabled={busy}
          aria-disabled={busy}
          aria-busy={demoLoading}
          onClick={handleDemoSignIn}
          className="w-full rounded-xl py-3 px-4 text-sm font-semibold transition-opacity min-h-[44px]"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: 'transparent',
            color: 'var(--ink-2)',
            border: '1.5px dashed var(--border)',
            opacity: busy ? 0.65 : 1,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {demoLoading ? (
            'Setting up demo…'
          ) : (
            <>
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z" stroke="currentColor" strokeWidth="1.25" />
                <path d="M6 6c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                <circle cx="8" cy="11" r=".75" fill="currentColor" />
              </svg>
              Try Demo
            </>
          )}
        </button>
        <p className="text-center text-xs" style={{ color: 'var(--ink-4)' }}>
          No account needed · session lasts 2 hours · data auto-deleted
        </p>
      </div>

      {/* Sign-in error */}
      {error !== null && (
        <p className="text-sm text-center" style={{ color: 'var(--neg)' }}>
          {error}
        </p>
      )}

      {/* Privacy note */}
      <p className="text-center text-xs" style={{ color: 'var(--ink-4)' }}>
        Your data is encrypted and never shared with third parties.
      </p>
    </div>
  )
}
