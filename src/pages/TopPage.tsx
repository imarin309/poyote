import { Header } from '../components/Header/Header'
import {
  FEATURE_ROUTES,
  ROUTE_DESCRIPTIONS,
  ROUTE_LABELS,
} from '../types/route'
import type { Route } from '../types/route'
import { pathForRoute } from '../utils/route'

interface TopPageProps {
  route: Route
  onNavigate: (route: Route) => void
}

export function TopPage({ route, onNavigate }: TopPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-neutral-950 px-4 py-10 text-neutral-100">
      {/* トップは機能を選ぶだけなので、ページ固有のヘルプは出さない */}
      <Header route={route} onNavigate={onNavigate} />

      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          {FEATURE_ROUTES.map((item) => (
            // 別ページとしてブックマークや新規タブで開けるよう、実URLのリンクにする
            <a
              key={item}
              href={pathForRoute(item)}
              onClick={(event) => {
                // 修飾キー付きのクリックはブラウザ本来の遷移に任せる
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                ) {
                  return
                }
                event.preventDefault()
                onNavigate(item)
              }}
              className="flex flex-col gap-2 rounded-xl border border-neutral-700 p-6 transition-colors hover:border-blue-400 hover:bg-neutral-900"
            >
              <span className="text-lg font-semibold">
                {ROUTE_LABELS[item]}
              </span>
              <span className="text-sm text-neutral-400">
                {ROUTE_DESCRIPTIONS[item]}
              </span>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}
