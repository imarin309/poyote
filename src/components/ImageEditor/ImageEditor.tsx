import { useEffect } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { ASPECT_PRESETS } from '../../utils/aspectPresets'
import type { CropRect, ResizeHandle } from '../../utils/cropRect'
import type { LoadedImage } from '../../types/image'
import type { SavedImage } from '../../hooks/useImageSave'

const HANDLES: { id: ResizeHandle; cursor: string; label: string }[] = [
  { id: 'nw', cursor: 'cursor-nw-resize', label: '左上' },
  { id: 'ne', cursor: 'cursor-ne-resize', label: '右上' },
  { id: 'sw', cursor: 'cursor-sw-resize', label: '左下' },
  { id: 'se', cursor: 'cursor-se-resize', label: '右下' },
]

interface ImageEditorProps {
  image: LoadedImage | null
  index: number
  total: number
  savedCount: number
  skippedCount: number
  isFinished: boolean
  presetIndex: number
  crop: CropRect | null
  baseFileName: string
  isSaving: boolean
  error: string | null
  notice: string | null
  lastSaved: SavedImage | null
  onSelectPreset: (index: number) => void
  onMeasure: (image: HTMLImageElement) => void
  onBeginDrag: (
    mode: 'move' | ResizeHandle,
    event: PointerEvent<HTMLElement>,
  ) => void
  onPointerMove: (event: PointerEvent<HTMLElement>) => void
  onEndDrag: (event: PointerEvent<HTMLElement>) => void
  onResizeByKey: (
    handle: ResizeHandle,
    event: KeyboardEvent<HTMLElement>,
  ) => void
  onBaseFileNameChange: (value: string) => void
  onSave: () => void
  onSkip: () => void
  onCancelAll: () => void
  onRestart: () => void
  onChangeImage: () => void
}

export function ImageEditor({
  image,
  index,
  total,
  savedCount,
  skippedCount,
  isFinished,
  presetIndex,
  crop,
  baseFileName,
  isSaving,
  error,
  notice,
  lastSaved,
  onSelectPreset,
  onMeasure,
  onBeginDrag,
  onPointerMove,
  onEndDrag,
  onResizeByKey,
  onBaseFileNameChange,
  onSave,
  onSkip,
  onCancelAll,
  onRestart,
  onChangeImage,
}: ImageEditorProps) {
  useEffect(() => {
    const handleResize = () => {
      const node = document.getElementById('crop-preview')
      if (node instanceof HTMLImageElement) {
        onMeasure(node)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [onMeasure])

  const preset = ASPECT_PRESETS[presetIndex]
  // 複数枚のときだけ進捗・スキップ・全てキャンセルを出す
  const hasQueue = total > 1
  const unprocessed = Math.max(total - savedCount - skippedCount, 0)

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      {isFinished || !image ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-neutral-700 px-8 py-6 text-center">
          <p className="text-sm text-neutral-200">切り取りを終えました</p>
          <p data-testid="queue-summary" className="text-xs text-neutral-400">
            {total} 件中 {savedCount} 件を保存、{skippedCount} 件スキップ
            {unprocessed > 0 && `、${unprocessed} 件は未処理`}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              data-testid="restart-queue-button"
              onClick={onRestart}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              最初から切り取る
            </button>
            <button
              type="button"
              data-testid="change-image-button"
              onClick={onChangeImage}
              className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-600"
            >
              別の画像を選ぶ
            </button>
          </div>
        </div>
      ) : (
        <>
          {hasQueue && (
            <p
              data-testid="queue-progress"
              className="text-xs text-neutral-400"
            >
              {index + 1} / {total} 件
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            {ASPECT_PRESETS.map((item, presetItemIndex) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onSelectPreset(presetItemIndex)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  presetItemIndex === presetIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-neutral-400">
            ドラッグで移動 /
            四隅でリサイズ（ハンドルは矢印キーでも動かせます）・ 出力:{' '}
            {preset.width}×{preset.height}px
          </p>

          <div
            className="relative touch-none select-none"
            onPointerDown={(event) => onBeginDrag('move', event)}
            onPointerMove={onPointerMove}
            onPointerUp={onEndDrag}
            onPointerCancel={onEndDrag}
          >
            {/* 切り取り範囲外を暗くする box-shadow は 9999px 広がるので画像の中で切る */}
            <div className="relative overflow-hidden">
              <img
                // 画像を切り替えたときに前の画像の計測結果を引きずらないよう作り直す
                key={image.objectUrl}
                id="crop-preview"
                src={image.objectUrl}
                alt={image.file.name}
                draggable={false}
                // キャッシュ済みの画像は onLoad が発火しないことがあるため、
                // マウント時点で読み込み済みなら直接計測する
                ref={(node) => {
                  if (node?.complete) {
                    onMeasure(node)
                  }
                }}
                onLoad={(event) => onMeasure(event.currentTarget)}
                className="block max-h-[60vh] max-w-full cursor-move"
              />

              {crop && (
                <div
                  data-testid="crop-area"
                  className="pointer-events-none absolute border-2 border-dashed border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.width,
                    height: crop.height,
                  }}
                />
              )}
            </div>

            {/* ハンドルは半分はみ出すので、暗転を切るコンテナの外に置く */}
            {crop &&
              HANDLES.map(({ id, cursor, label }) => (
                <button
                  key={id}
                  type="button"
                  data-testid={`crop-handle-${id}`}
                  aria-label={`切り取り範囲の${label}をリサイズ`}
                  onPointerDown={(event) => onBeginDrag(id, event)}
                  onKeyDown={(event) => onResizeByKey(id, event)}
                  className={`absolute z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-neutral-800 bg-white ${cursor}`}
                  style={{
                    left:
                      id === 'nw' || id === 'sw' ? crop.x : crop.x + crop.width,
                    top:
                      id === 'nw' || id === 'ne'
                        ? crop.y
                        : crop.y + crop.height,
                  }}
                />
              ))}
          </div>

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

          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              data-testid="crop-save-button"
              onClick={onSave}
              disabled={isSaving || !crop}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? '保存中…' : 'この範囲で保存'}
            </button>
            {hasQueue && (
              <button
                type="button"
                data-testid="skip-image-button"
                onClick={onSkip}
                disabled={isSaving}
                className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                この画像はスキップ
              </button>
            )}
            {hasQueue && (
              <button
                type="button"
                data-testid="cancel-queue-button"
                onClick={onCancelAll}
                disabled={isSaving}
                className="rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                全てキャンセル
              </button>
            )}
            <button
              type="button"
              data-testid="change-image-button"
              onClick={onChangeImage}
              disabled={isSaving}
              className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              画像を変更
            </button>
          </div>
        </>
      )}

      {/* 除外ファイルの警告はドロップゾーンが消えたあとにも見せる必要がある */}
      {notice && (
        <p data-testid="image-notice" className="text-sm text-amber-400">
          {notice}
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {lastSaved && (
        <div className="flex items-center gap-3 rounded-md border border-neutral-700 p-2">
          <img
            src={lastSaved.objectUrl}
            alt="直前に保存した画像"
            className="h-16 w-auto rounded"
          />
          <p className="text-xs text-neutral-400">
            保存しました: {lastSaved.filename}
          </p>
        </div>
      )}
    </div>
  )
}
