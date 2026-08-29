import { useEffect } from 'react'
import type { PointerEvent } from 'react'
import { ASPECT_PRESETS } from '../../utils/aspectPresets'
import type { CropRect, ResizeHandle } from '../../utils/cropRect'
import type { LoadedImage } from '../../types/image'
import type { SavedImage } from '../../hooks/useImageSave'

const HANDLES: { id: ResizeHandle; cursor: string }[] = [
  { id: 'nw', cursor: 'cursor-nw-resize' },
  { id: 'ne', cursor: 'cursor-ne-resize' },
  { id: 'sw', cursor: 'cursor-sw-resize' },
  { id: 'se', cursor: 'cursor-se-resize' },
]

interface ImageEditorProps {
  image: LoadedImage
  presetIndex: number
  crop: CropRect | null
  baseFileName: string
  isSaving: boolean
  error: string | null
  lastSaved: SavedImage | null
  onSelectPreset: (index: number) => void
  onMeasure: (image: HTMLImageElement) => void
  onBeginDrag: (
    mode: 'move' | ResizeHandle,
    event: PointerEvent<HTMLElement>,
  ) => void
  onPointerMove: (event: PointerEvent<HTMLElement>) => void
  onEndDrag: (event: PointerEvent<HTMLElement>) => void
  onBaseFileNameChange: (value: string) => void
  onSave: () => void
  onChangeImage: () => void
}

export function ImageEditor({
  image,
  presetIndex,
  crop,
  baseFileName,
  isSaving,
  error,
  lastSaved,
  onSelectPreset,
  onMeasure,
  onBeginDrag,
  onPointerMove,
  onEndDrag,
  onBaseFileNameChange,
  onSave,
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

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {ASPECT_PRESETS.map((item, index) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelectPreset(index)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              index === presetIndex
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-neutral-400">
        ドラッグで移動 / 四隅でリサイズ ・ 出力: {preset.width}×{preset.height}
        px
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
          HANDLES.map(({ id, cursor }) => (
            <div
              key={id}
              data-testid={`crop-handle-${id}`}
              onPointerDown={(event) => onBeginDrag(id, event)}
              className={`absolute z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-neutral-800 bg-white ${cursor}`}
              style={{
                left: id === 'nw' || id === 'sw' ? crop.x : crop.x + crop.width,
                top: id === 'nw' || id === 'ne' ? crop.y : crop.y + crop.height,
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
