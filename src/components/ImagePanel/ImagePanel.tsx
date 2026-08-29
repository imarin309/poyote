import type { LoadedImage } from '../../types/image'
import type { LastCapture } from '../../hooks/useCaptureSave'
import type { ConvertResult } from '../../hooks/useBatchConvert'
import { MAX_OUTPUT_BYTES } from '../../utils/imageQuality'

const MAX_OUTPUT_KB = Math.round(MAX_OUTPUT_BYTES / 1024)

function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`
}

interface ImagePanelProps {
  current: LoadedImage | null
  index: number
  total: number
  savedCount: number
  skippedCount: number
  isFinished: boolean
  baseFileName: string
  onBaseFileNameChange: (value: string) => void
  onResumeCrop: () => void
  onConvertAll: () => void
  onChangeImages: () => void
  isSaving: boolean
  error: string | null
  lastCapture: LastCapture | null
  isConverting: boolean
  convertProgress: { current: number; total: number }
  convertResults: ConvertResult[]
  convertError: string | null
}

export function ImagePanel({
  current,
  index,
  total,
  savedCount,
  skippedCount,
  isFinished,
  baseFileName,
  onBaseFileNameChange,
  onResumeCrop,
  onConvertAll,
  onChangeImages,
  isSaving,
  error,
  lastCapture,
  isConverting,
  convertProgress,
  convertResults,
  convertError,
}: ImagePanelProps) {
  const busy = isSaving || isConverting
  const oversized = convertResults.filter((result) => !result.withinLimit)
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      {isFinished ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-neutral-700 px-8 py-6 text-center">
          <p className="text-sm text-neutral-200">処理完了</p>
          <p data-testid="queue-summary" className="text-xs text-neutral-400">
            {total} 件中 {savedCount} 件を保存、{skippedCount} 件スキップ
          </p>
        </div>
      ) : (
        current && (
          <>
            <p
              data-testid="queue-progress"
              className="text-xs text-neutral-400"
            >
              {index + 1} / {total} 件
            </p>
            <img
              src={current.objectUrl}
              alt={current.file.name}
              className="max-h-[40vh] max-w-full rounded-md border border-neutral-800"
            />
            <p className="text-xs text-neutral-500">{current.file.name}</p>

            <div className="flex w-full items-center gap-2">
              <label
                htmlFor="image-base-file-name"
                className="shrink-0 text-sm text-neutral-400"
              >
                ファイル名
              </label>
              <input
                id="image-base-file-name"
                type="text"
                value={baseFileName}
                onChange={(event) => onBaseFileNameChange(event.target.value)}
                className="w-full rounded-md border border-neutral-600 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100"
              />
            </div>
          </>
        )
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {!isFinished && current && (
          <button
            type="button"
            data-testid="image-crop-button"
            onClick={onResumeCrop}
            disabled={busy}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            トリミングして保存
          </button>
        )}

        <button
          type="button"
          data-testid="convert-all-button"
          onClick={onConvertAll}
          disabled={busy || total === 0}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isConverting
            ? `変換中… ${convertProgress.current} / ${convertProgress.total}`
            : `比率そのままで一括変換（${total}件）`}
        </button>

        <button
          type="button"
          data-testid="change-image-button"
          onClick={onChangeImages}
          disabled={busy}
          className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isFinished ? '別の画像を選ぶ' : '画像を変更'}
        </button>
      </div>

      <p className="text-center text-xs text-neutral-500">
        一括変換は縦横比もピクセル数も変えず、{MAX_OUTPUT_KB}KB
        以下に収まるまで品質を下げて webp で保存します
      </p>

      {convertError && (
        <p role="alert" className="text-sm text-red-400">
          {convertError}
        </p>
      )}

      {convertResults.length > 0 && !isConverting && (
        <div
          data-testid="convert-results"
          className="w-full max-w-md rounded-md border border-neutral-700 p-3"
        >
          <p className="mb-2 text-xs text-neutral-300">
            {convertResults.length} 件を変換しました
            {oversized.length > 0 &&
              `（うち ${oversized.length} 件は ${MAX_OUTPUT_KB}KB に収まりませんでした）`}
          </p>
          <ul className="flex flex-col gap-1">
            {convertResults.map((result, index) => (
              <li
                key={`${result.filename}-${index}`}
                className="flex justify-between gap-3 text-xs"
              >
                <span className="truncate text-neutral-400">
                  {result.filename}
                </span>
                <span
                  className={
                    result.withinLimit
                      ? 'shrink-0 tabular-nums text-neutral-400'
                      : 'shrink-0 tabular-nums text-amber-400'
                  }
                >
                  {formatKB(result.bytes)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {lastCapture && (
        <div className="flex items-center gap-3 rounded-md border border-neutral-700 p-2">
          <img
            src={lastCapture.objectUrl}
            alt="直前に保存した画像"
            className="h-16 w-auto rounded"
          />
          <p className="text-xs text-neutral-400">{lastCapture.filename}</p>
        </div>
      )}
    </div>
  )
}
