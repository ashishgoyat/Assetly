/**
 * Auth layout — Server Component
 * Full-screen centered layout for login and signup pages.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)' }}
    >
      {/* Wordmark */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl font-bold"
          style={{
            background: 'var(--ink)',
            color: 'var(--bg)',
            fontFamily: 'var(--f-sans)',
          }}
          aria-hidden="true"
        >
          A
        </div>
        <span
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--f-sans)', color: 'var(--ink)' }}
        >
          Assetly
        </span>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {children}
      </div>

      {/* Footer note */}
      <p className="mt-6 text-xs text-center" style={{ color: 'var(--ink-4)' }}>
        By signing in you agree to our{' '}
        <span style={{ color: 'var(--ink-3)' }}>Terms</span> and{' '}
        <span style={{ color: 'var(--ink-3)' }}>Privacy Policy</span>.
      </p>
    </div>
  );
}
