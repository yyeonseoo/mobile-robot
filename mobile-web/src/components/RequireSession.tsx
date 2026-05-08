import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getVisitorToken } from '../lib/storage'

export default function RequireSession({ children }: { children: ReactNode }) {
  const nav = useNavigate()
  const loc = useLocation()

  useEffect(() => {
    if (getVisitorToken()) return
    const next =
      loc.pathname.startsWith('/rally') ? 'rally' : ''
    nav(`/enter${next ? `?next=${encodeURIComponent(next)}` : ''}`, { replace: true })
  }, [loc.pathname, nav])

  if (!getVisitorToken()) return null
  return <>{children}</>
}

