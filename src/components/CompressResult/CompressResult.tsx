import type { CompressionStatus } from '../../types/compression'

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))}KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

interface CompressResultProps {
  status: CompressionStatus
  originalSize: number
  onCancel: () => void
  videoRef: (node: HTMLVideoElement | null) => void
  currentTime: number
  duration: number
  onSaveVideo: () => void
  posterTime: number
  onPosterTimeChange: (seconds: number) => void
  onSavePoster: () => void
  isSavingPoster: boolean
  posterError: string | null
}

export function CompressResult({
  status,
  originalSize,
  onCancel,
  videoRef,
  currentTime,
  duration,
  onSaveVideo,
  posterTime,
  onPosterTimeChange,
  onSavePoster,
  isSavingPoster,
  posterError,
}: CompressResultProps) {
  if (status.phase === 'idle') {
    return null
  }

  if (status.phase === 'error') {
    return (
      <p role="alert" className="text-sm text-red-400">
        {status.message}
      </p>
    )
  }

  if (status.phase === 'converting') {
    const percent = Math.round(status.progress * 100)
    return (
      <div className="flex w-full flex-col items-center gap-3">
        <progress
          value={status.progress}
          max={1}
          aria-label="変換の進捗"
          className="h-2 w-full overflow-hidden rounded-full accent-blue-500"
        />
        <p className="text-sm text-neutral-400">変換中… {percent}%</p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-neutral-600 px-4 py-1.5 text-sm hover:border-red-400 hover:text-red-300"
        >
          キャンセル
        </button>
      </div>
    )
  }

  const { result } = status
  const reductionPercent = Math.round(
    (1 - result.blob.size / originalSize) * 100,
  )

  return (
    <div className="flex w-full flex-col gap-4">
      <video
        key={result.objectUrl}
        ref={videoRef}
        src={result.objectUrl}
        controls
        loop
        playsInline
        className="w-full rounded-md bg-black"
      />

      <p className="text-center text-sm text-neutral-300">
        {formatFileSize(originalSize)} → {formatFileSize(result.blob.size)}
        {reductionPercent > 0 && (
          <span className="text-neutral-400">（{reductionPercent}%削減）</span>
        )}
      </p>

      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onSaveVideo}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          mp4を保存
        </button>
        <p className="text-xs wrap-anywhere text-neutral-400">
          {result.filename}
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-neutral-700 p-3">
        <p className="text-sm font-medium">poster（サムネイル）</p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor="poster-time" className="text-neutral-400">
            秒数
          </label>
          <input
            id="poster-time"
            type="number"
            min={0}
            max={duration > 0 ? duration : undefined}
            step={0.1}
            value={posterTime}
            onChange={(event) => {
              const seconds = event.target.valueAsNumber
              if (Number.isFinite(seconds)) {
                onPosterTimeChange(seconds)
              }
            }}
            className="w-24 rounded-md border border-neutral-600 bg-neutral-900 px-2 py-1 text-neutral-100"
          />
          <button
            type="button"
            onClick={() => onPosterTimeChange(currentTime)}
            className="rounded-md border border-neutral-600 px-3 py-1 hover:border-blue-400"
          >
            再生位置（{currentTime.toFixed(1)}秒）を使う
          </button>
          <button
            type="button"
            onClick={onSavePoster}
            disabled={isSavingPoster}
            className="rounded-md bg-emerald-600 px-3 py-1 font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSavingPoster ? '保存中…' : 'posterを保存'}
          </button>
        </div>
        {posterError && (
          <p role="alert" className="text-sm text-red-400">
            {posterError}
          </p>
        )}
      </div>
    </div>
  )
}
