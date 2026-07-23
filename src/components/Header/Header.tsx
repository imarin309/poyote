interface HeaderProps {
  bordered?: boolean
  onOpenHelp: () => void
}

export function Header({ bordered = false, onOpenHelp }: HeaderProps) {
  return (
    <header
      className={`grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-4 ${
        bordered ? 'border-b border-neutral-800' : ''
      }`}
    >
      <div />
      <div className="col-start-2 flex items-center justify-self-center gap-2">
        <img src="/travel_anpan.png" alt="" className="h-8 w-8 rounded" />
        <h1 className="text-2xl font-semibold">poyote</h1>
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
          使い方はこちら
        </button>
      </div>
    </header>
  )
}
