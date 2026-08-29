import { useCallback, useEffect, useState } from 'react'
import { pathForRoute, routeFromPath } from '../utils/route'
import type { Route } from '../types/route'

export function useRoute() {
  const [route, setRoute] = useState<Route>(() =>
    routeFromPath(window.location.pathname),
  )

  useEffect(() => {
    const handlePopState = () => {
      setRoute(routeFromPath(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((next: Route) => {
    window.history.pushState(null, '', pathForRoute(next))
    setRoute(next)
  }, [])

  return { route, navigate }
}
