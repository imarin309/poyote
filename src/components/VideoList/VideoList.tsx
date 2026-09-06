import type { LoadedVideo } from '../../types/video'
import { formatDuration } from '../../utils/formatTime'

interface VideoListProps {
  videos: LoadedVideo[]
  selectedIndex: number
  durations: Map<string, number | null>
  isUnplayable: (video: LoadedVideo) => boolean
  onSelect: (index: number) => void
  onReload: () => void
}

const UNKNOWN_DURATION = '--:--'

export function VideoList({
  videos,
  selectedIndex,
  durations,
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
          const seconds = durations.get(video.objectUrl)
          // 計測前と長さ不明を同じ表示にまとめる。どちらもこの動画からは長さを出せない
          const duration =
            seconds == null ? UNKNOWN_DURATION : formatDuration(seconds)

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
                <span className="shrink-0 text-xs text-neutral-400">
                  {duration}
                </span>
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
