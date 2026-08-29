import { ROUTE_PATHS, ROUTES } from '../types/route'
import type { Route } from '../types/route'

const DEFAULT_ROUTE: Route = 'top'

// 末尾スラッシュの有無で別ページ扱いにならないようにそろえる
function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

export function routeFromPath(pathname: string): Route {
  const normalized = normalize(pathname)
  return (
    ROUTES.find((route) => ROUTE_PATHS[route] === normalized) ?? DEFAULT_ROUTE
  )
}

export function pathForRoute(route: Route): string {
  return ROUTE_PATHS[route]
}
