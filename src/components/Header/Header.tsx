import type { MouseEvent } from 'react'
import { ROUTE_DESCRIPTIONS } from '../../types/route'
import type { Route } from '../../types/route'
import { pathForRoute } from '../../utils/route'

interface HeaderProps {
  bordered?: boolean
  route: Route
  onNavigate: (route: Route) => void
  onOpenHelp: () => void
}

// 修飾キー付きのクリックはブラウザ本来の遷移に任せる
function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

export function Header({
  bordered = false,
  route,
  onNavigate,
  onOpenHelp,
}: HeaderProps) {
  return (
    <header
      className={`grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-4 ${
        bordered ? 'border-b border-neutral-800' : ''
      }`}
    >
      <div />
      <div className="col-start-2 flex flex-col items-center justify-self-center gap-1.5">
        {/* 別ページとしてブックマークや新規タブで開けるよう、実URLのリンクにする */}
        <a
          href={pathForRoute('top')}
          data-testid="nav-top"
          onClick={(event) => {
            if (isModifiedClick(event)) {
              return
            }
            event.preventDefault()
            onNavigate('top')
          }}
          className="flex items-center gap-2"
        >
          <img src="/travel_anpan.png" alt="" className="h-8 w-8 rounded" />
          <h1 className="text-2xl font-semibold">poyote</h1>
        </a>
        <p className="text-sm text-neutral-400">{ROUTE_DESCRIPTIONS[route]}</p>
      </div>
      <div className="col-start-3 flex justify-end">
        <button
          type="button"
          onClick={onOpenHelp}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-600 px-3 py-1.5 text-sm font-medium text-neutral-100 hover:border-blue-400 hover:bg-neutral-800"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] font-bold">
            ?
          </span>
          Help
        </button>
      </div>
    </header>
  )
}
