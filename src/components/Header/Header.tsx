import { MODE_DESCRIPTIONS, MODE_LABELS } from '../../types/mode'
import type { AppMode } from '../../types/mode'

const MODES: AppMode[] = ['video', 'image']

interface HeaderProps {
  bordered?: boolean
  mode: AppMode
  onModeChange: (mode: AppMode) => void
  onOpenHelp: () => void
}

export function Header({
  bordered = false,
  mode,
  onModeChange,
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
        <div className="flex items-center gap-2">
          <img src="/travel_anpan.png" alt="" className="h-8 w-8 rounded" />
          <h1 className="text-2xl font-semibold">poyote</h1>
        </div>
        <p className="text-sm text-neutral-400">{MODE_DESCRIPTIONS[mode]}</p>
        <div
          role="tablist"
          aria-label="モード"
          className="mt-1 flex gap-1 rounded-full border border-neutral-700 p-1"
        >
          {MODES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={item === mode}
              data-testid={`mode-tab-${item}`}
              onClick={() => onModeChange(item)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                item === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
              }`}
            >
              {MODE_LABELS[item]}
            </button>
          ))}
        </div>
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
