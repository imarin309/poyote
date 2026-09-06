import type { LoadedVideo } from '../../types/video'

interface VideoListProps {
  videos: LoadedVideo[]
  selectedIndex: number
  isUnplayable: (video: LoadedVideo) => boolean
  onSelect: (index: number) => void
  onReload: () => void
}

export function VideoList({
  videos,
  selectedIndex,
  isUnplayable,
  onSelect,
  onReload,
}: VideoListProps) {
  return (
    <div
      data-testid="video-list"
      className="flex w-full shrink-0 items-center gap-3 border-b border-neutral-800 px-4 py-2"
    >
      {/* 本数が多いと横に溢れるが、縦に積むとサムネイル領域を圧迫するため横スクロールにする */}
      <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
        {videos.map((video, index) => {
          const unplayable = isUnplayable(video)
          const selected = index === selectedIndex

          return (
            <li key={video.objectUrl} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(index)}
                disabled={unplayable}
                aria-current={selected ? 'true' : undefined}
                title={video.file.name}
                className={`flex max-w-48 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? 'border-blue-400 bg-neutral-800 text-neutral-100'
                    : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <span className="truncate">{video.file.name}</span>
                {unplayable && (
                  <span className="shrink-0 text-xs text-red-400">
                    再生不可
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={onReload}
        className="ml-auto shrink-0 rounded-md border border-neutral-600 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800"
      >
        読み込み直す
      </button>
    </div>
  )
}
