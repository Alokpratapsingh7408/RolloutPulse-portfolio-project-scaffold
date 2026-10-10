import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { supabase } from '../lib/supabase'

const DEMO_EMAIL = 'admin@rolloutpulse.test'
const DEMO_PASSWORD = 'RolloutPulse123!'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(data.session !== null)
    })
  }, [])

  if (hasSession) return <Navigate to="/" replace />

  async function signIn(signInEmail: string, signInPassword: string) {
    setError(null)
    setIsSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password: signInPassword })
    setIsSubmitting(false)
    if (error) setError(error.message)
    else navigate('/', { replace: true })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void signIn(email, password)
  }

  function handleFillDemo() {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-50 to-brand-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow-md shadow-brand-600/20">
            R
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">RolloutPulse</h1>
          <p className="text-sm text-slate-500">Progressive rollout monitoring, live.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-status-failed">
              {error}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting} className="w-full">
            Sign in
          </Button>
        </form>

        <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-sm">
          <p className="font-semibold text-brand-900">Just here to look around?</p>
          <p className="mt-0.5 text-brand-700">
            This is a portfolio demo — use the read-only demo account, no signup needed.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-brand-800">
            <span>{DEMO_EMAIL}</span>
            <span className="text-brand-300" aria-hidden="true">
              ·
            </span>
            <span>{DEMO_PASSWORD}</span>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="mt-3 w-full rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            Fill demo credentials
          </button>
        </div>
      </div>
    </main>
  )
}
