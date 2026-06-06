'use client'

import { useEffect, useState } from 'react'

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'expired'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function DemoBanner({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState(() => formatTimeLeft(expiresAt))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(formatTimeLeft(expiresAt)), 60_000)
    return () => clearInterval(id)
  }, [expiresAt])

  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-xl mb-4"
      style={{
        background: 'var(--warn-soft)',
        color: 'var(--warn)',
        border: '1px solid color-mix(in srgb, var(--warn) 20%, transparent)',
      }}
    >
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.75" fill="currentColor" />
      </svg>
      Demo session · data auto-deletes in {timeLeft}
    </div>
  )
}
