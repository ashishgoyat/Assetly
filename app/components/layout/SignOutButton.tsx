'use client'

/**
 * SignOutButton — Client Component
 * Renders a form that calls the signOut server action.
 * Client components can import and invoke server actions from 'use server' modules.
 */

import Icon from '@/app/components/ui/Icon'
import { signOutAction } from '@/app/components/layout/sign-out-action'

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="nav-item w-full"
        style={{ color: 'var(--ink-3)' }}
        aria-label="Sign out of Assetly"
      >
        <span className="nav-icon">
          <Icon name="arrowR" size={15} color="var(--ink-4)" />
        </span>
        <span className="user-name">Sign out</span>
      </button>
    </form>
  )
}
