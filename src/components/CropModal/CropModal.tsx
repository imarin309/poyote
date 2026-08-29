import { useEffect } from 'react'
import type { PointerEvent } from 'react'
import { ASPECT_PRESETS } from '../../utils/aspectPresets'
import type { CropRect, ResizeHandle } from '../../utils/cropRect'

const HANDLES: { id: ResizeHandle; cursor: string }[] = [
  { id: 'nw', cursor: 'cursor-nw-resize' },
  { id: 'ne', cursor: 'cursor-ne-resize' },
  { id: 'sw', cursor: 'cursor-sw-resize' },
  { id: 'se', cursor: 'cursor-se-resize' },
]

interface CropModalProps {
  previewUrl: string | null
  presetIndex: number
  crop: CropRect | null
  isSaving: boolean
  error: string | null
  onSelectPreset: (index: number) => void
  onMeasure: (image: HTMLImageElement) => void
  onBeginDrag: (
    mode: 'move' | ResizeHandle,
    event: PointerEvent<HTMLElement>,
  ) => void
  onPointerMove: (event: PointerEvent<HTMLElement>) => void
  onEndDrag: (event: PointerEvent<HTMLElement>) => void
  onConfirm: () => void
  onClose: () => void
}

export function CropModal({
  previewUrl,
  presetIndex,
  crop,
  isSaving,
  error,
  onSelectPreset,
  onMeasure,
  onBeginDrag,
  onPointerMove,
  onEndDrag,
  onConfirm,
  onClose,
}: CropModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    const handleResize = () => {
      const image = document.getElementById('crop-preview')
      if (image instanceof HTMLImageElement) {
        onMeasure(image)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [onMeasure])

  const preset = ASPECT_PRESETS[presetIndex]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/60 p-4"
    >
      {/* 切り取り範囲の box-shadow は絶対配置で周囲を覆うため、UIをその上へ出す */}
      <div className="relative z-10 text-center">
        <h2 id="crop-modal-title" className="text-sm text-neutral-200">
          切り取り範囲を選択してください
        </h2>
        <p className="mt-1 text-xs text-neutral-400">
          ドラッグで移動 / 四隅でリサイズ ・ 出力: {preset.width}×
          {preset.height}px
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap justify-center gap-2">
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

      <div
        className="relative touch-none select-none"
        onPointerDown={(event) => onBeginDrag('move', event)}
        onPointerMove={onPointerMove}
        onPointerUp={onEndDrag}
        onPointerCancel={onEndDrag}
      >
        {previewUrl && (
          <img
            id="crop-preview"
            src={previewUrl}
            alt="切り取り対象の画像"
            draggable={false}
            // キャッシュ済みの画像は onLoad が発火しないことがあるため、
            // マウント時点で読み込み済みなら直接計測する
            ref={(node) => {
              if (node?.complete) {
                onMeasure(node)
              }
            }}
            onLoad={(event) => onMeasure(event.currentTarget)}
            className="block max-h-[60vh] max-w-[90vw] cursor-move"
          />
        )}

        {crop && (
          <>
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
            {HANDLES.map(({ id, cursor }) => (
              <div
                key={id}
                data-testid={`crop-handle-${id}`}
                onPointerDown={(event) => onBeginDrag(id, event)}
                className={`absolute z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-neutral-800 bg-white ${cursor}`}
                style={{
                  left:
                    id === 'nw' || id === 'sw' ? crop.x : crop.x + crop.width,
                  top:
                    id === 'nw' || id === 'ne' ? crop.y : crop.y + crop.height,
                }}
              />
            ))}
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="relative z-10 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="relative z-10 flex gap-3">
        <button
          type="button"
          data-testid="crop-confirm-button"
          onClick={onConfirm}
          disabled={isSaving || !crop}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? '保存中…' : 'この範囲で保存'}
        </button>
        <button
          type="button"
          data-testid="crop-cancel-button"
          onClick={onClose}
          disabled={isSaving}
          className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
