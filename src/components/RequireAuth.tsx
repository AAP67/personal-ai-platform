import { Navigate, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  console.log('[RequireAuth]', { path: location.pathname, loading, uid: user?.uid ?? null })

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <span className="text-zinc-500 animate-pulse text-sm">Loading…</span>
      </div>
    )
  }

  if (!user) {
    console.log('[RequireAuth] no user → redirecting to /auth')
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return <>{children}</>
}
