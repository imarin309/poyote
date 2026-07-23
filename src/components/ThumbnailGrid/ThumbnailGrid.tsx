import type { Thumbnail } from '../../types/video'
import { formatDuration } from '../../utils/formatTime'

interface ThumbnailGridProps {
  thumbnails: Thumbnail[]
  isGenerating: boolean
  progress: { current: number; total: number }
  onSeek: (time: number) => void
}

export function ThumbnailGrid({
  thumbnails,
  isGenerating,
  progress,
  onSeek,
}: ThumbnailGridProps) {
  if (thumbnails.length === 0 && !isGenerating) {
    return null
  }

  return (
    <div
      data-testid="thumbnail-grid"
      className="flex w-full max-w-3xl flex-col gap-2"
    >
      {isGenerating && (
        <p
          data-testid="thumbnail-progress"
          className="text-sm text-neutral-400"
        >
          サムネイル生成中… {progress.current}/{progress.total}
        </p>
      )}
      <div className="grid grid-cols-6 gap-2">
        {thumbnails.map((thumbnail) => (
          <button
            key={thumbnail.time}
            type="button"
            data-testid="thumbnail-item"
            onClick={() => onSeek(thumbnail.time)}
            disabled={isGenerating}
            className="overflow-hidden rounded border border-neutral-700 hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <img
              src={thumbnail.objectUrl}
              alt={formatDuration(thumbnail.time)}
              className="w-full"
            />
            <span className="block bg-black/60 px-1 text-[10px] text-neutral-200">
              {formatDuration(thumbnail.time)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
