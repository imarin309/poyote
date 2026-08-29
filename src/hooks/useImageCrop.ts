import { useCallback, useRef, useState } from 'react'
import { cropImageToBlob } from '../services/cropImage'
import { ASPECT_PRESETS, presetRatio } from '../utils/aspectPresets'
import {
  createInitialCrop,
  moveCrop,
  rescaleCrop,
  resizeCrop,
  toSourceRect,
} from '../utils/cropRect'
import type { CropRect, ResizeHandle, Size } from '../utils/cropRect'
import type { KeyboardEvent, PointerEvent } from 'react'

type DragMode = 'move' | ResizeHandle

interface DragState {
  mode: DragMode
  pointerId: number
  startX: number
  startY: number
  startCrop: CropRect
}

interface Geometry {
  display: Size
  crop: CropRect
}

const KEY_DIRECTIONS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

interface UseImageCropOptions {
  save: (createBlob: () => Promise<Blob>) => Promise<boolean>
}

export function useImageCrop({ save }: UseImageCropOptions) {
  const [presetIndex, setPresetIndex] = useState(0)
  const [geometry, setGeometry] = useState<Geometry | null>(null)

  const previewImageRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<DragState | null>(null)

  // 別の画像に切り替わったとき、前の画像の切り取り範囲を引き継がないようにする。
  // 比率プリセットは選び直す手間を避けるため維持する
  const reset = useCallback(() => {
    previewImageRef.current = null
    dragRef.current = null
    setGeometry(null)
  }, [])

  const measure = useCallback(
    (image: HTMLImageElement) => {
      previewImageRef.current = image
      const display = { width: image.clientWidth, height: image.clientHeight }
      if (display.width <= 0 || display.height <= 0) {
        return
      }

      setGeometry((previous) => {
        if (!previous) {
          return {
            display,
            crop: createInitialCrop(
              display,
              presetRatio(ASPECT_PRESETS[presetIndex]),
            ),
          }
        }

        if (
          previous.display.width === display.width &&
          previous.display.height === display.height
        ) {
          return previous
        }

        // 画面回転やリサイズでは選択範囲を作り直さず、同じ比率で拡縮する
        return {
          display,
          crop: rescaleCrop(
            previous.crop,
            previous.display,
            display,
            presetRatio(ASPECT_PRESETS[presetIndex]),
          ),
        }
      })
    },
    [presetIndex],
  )

  const selectPreset = useCallback((index: number) => {
    setPresetIndex(index)
    setGeometry((previous) => {
      if (!previous) {
        return previous
      }
      return {
        ...previous,
        crop: createInitialCrop(
          previous.display,
          presetRatio(ASPECT_PRESETS[index]),
        ),
      }
    })
  }, [])

  const beginDrag = useCallback(
    (mode: DragMode, event: PointerEvent<HTMLElement>) => {
      if (!geometry) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      dragRef.current = {
        mode,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startCrop: geometry.crop,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [geometry],
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) {
        return
      }

      const deltaX = event.clientX - drag.startX
      const deltaY = event.clientY - drag.startY

      setGeometry((previous) => {
        if (!previous) {
          return previous
        }

        const crop =
          drag.mode === 'move'
            ? moveCrop(drag.startCrop, deltaX, deltaY, previous.display)
            : resizeCrop(
                drag.startCrop,
                drag.mode,
                deltaX,
                deltaY,
                presetRatio(ASPECT_PRESETS[presetIndex]),
                previous.display,
              )

        return { ...previous, crop }
      })
    },
    [presetIndex],
  )

  // ハンドルは button なのでフォーカスできる。押しても何も起きない偽の操作子に
  // しないよう、矢印キーでもリサイズできるようにする
  const resizeByKey = useCallback(
    (handle: ResizeHandle, event: KeyboardEvent<HTMLElement>) => {
      const direction = KEY_DIRECTIONS[event.key]
      if (!direction) {
        return
      }

      event.preventDefault()
      const amount = event.shiftKey ? 20 : 4

      setGeometry((previous) => {
        if (!previous) {
          return previous
        }
        return {
          ...previous,
          crop: resizeCrop(
            previous.crop,
            handle,
            direction[0] * amount,
            direction[1] * amount,
            presetRatio(ASPECT_PRESETS[presetIndex]),
            previous.display,
          ),
        }
      })
    },
    [presetIndex],
  )

  const endDrag = useCallback((event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }
    dragRef.current = null
  }, [])

  // 保存できたかどうかを返し、閉じるかどうかは呼び出し元に委ねる
  const confirm = useCallback(async (): Promise<boolean> => {
    const previewImage = previewImageRef.current
    if (!previewImage || !geometry) {
      return false
    }

    // 切り取り元はプレビュー用の <img> 自身。別途デコードし直さないので二重エンコードにならない。
    // ブラウザは naturalWidth/Height にも drawImage にもEXIF回転を適用済みで返すため、
    // 表示と出力は自動で一致する
    const sourceSize = {
      width: previewImage.naturalWidth,
      height: previewImage.naturalHeight,
    }
    const preset = ASPECT_PRESETS[presetIndex]
    const sourceRect = toSourceRect(geometry.crop, geometry.display, sourceSize)

    return save(() =>
      cropImageToBlob(previewImage, sourceRect, {
        width: preset.width,
        height: preset.height,
      }),
    )
  }, [geometry, presetIndex, save])

  return {
    presetIndex,
    crop: geometry?.crop ?? null,
    reset,
    measure,
    selectPreset,
    beginDrag,
    handlePointerMove,
    endDrag,
    resizeByKey,
    confirm,
  }
}
