import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function ProtectedRoute() {
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(data.session !== null)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(session !== null)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  if (hasSession === null) return null
  if (!hasSession) return <Navigate to="/login" replace />
  return <Outlet />
}
