import { Header } from '../components/Header/Header'
import type { Route } from '../types/route'

interface ImagePageProps {
  route: Route
  onNavigate: (route: Route) => void
  onOpenHelp: () => void
}

export function ImagePage({ route, onNavigate, onOpenHelp }: ImagePageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-neutral-950 px-4 py-10 text-neutral-100">
      <Header route={route} onNavigate={onNavigate} onOpenHelp={onOpenHelp} />

      <main className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-semibold">準備中</p>
        <p className="text-sm text-neutral-400">
          画像をリサイズする機能はまだ準備中です。
        </p>
      </main>
    </div>
  )
}
