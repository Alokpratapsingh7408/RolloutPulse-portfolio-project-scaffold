import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from './Button'

export interface AppHeaderProps {
  breadcrumb?: ReactNode
}

export function AppHeader({ breadcrumb }: AppHeaderProps) {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              R
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900">RolloutPulse</span>
          </Link>
          {breadcrumb && (
            <nav aria-label="Breadcrumb" className="hidden min-w-0 truncate text-sm text-slate-600 sm:block">
              {breadcrumb}
            </nav>
          )}
        </div>
        <Button variant="secondary" onClick={handleSignOut} className="shrink-0 whitespace-nowrap">
          Sign out
        </Button>
      </div>
    </header>
  )
}
