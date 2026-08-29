import { useCallback, useEffect, useRef, useState } from 'react'
import { captureFrameToBlob } from '../services/captureFrame'
import { cropToBlob } from '../services/cropCapture'
import type { CropSource } from '../services/cropCapture'
import type { OutputFormat } from '../services/encodeImage'
import { ASPECT_PRESETS, presetRatio } from '../utils/aspectPresets'
import {
  createInitialCrop,
  moveCrop,
  resizeCrop,
  toSourceRect,
} from '../utils/cropRect'
import type { CropRect, ResizeHandle, Size } from '../utils/cropRect'
import type { PointerEvent } from 'react'

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

interface CropOrigin {
  // プレビューより高品質な切り取り元。null ならプレビュー画像自身から切り取る
  drawFrom: { source: CropSource; size: Size } | null
  ownsPreviewUrl: boolean
  format: OutputFormat
}

interface UseCropEditorOptions {
  onPause: () => void
  save: (createBlob: () => Promise<Blob>) => Promise<boolean>
}

export function useCropEditor({ onPause, save }: UseCropEditorOptions) {
  const [isOpen, setIsOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [presetIndex, setPresetIndex] = useState(0)
  const [geometry, setGeometry] = useState<Geometry | null>(null)
  const [error, setError] = useState<string | null>(null)

  const previewUrlRef = useRef<string | null>(null)
  const ownsPreviewUrlRef = useRef(false)
  const originRef = useRef<CropOrigin | null>(null)
  const previewImageRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<DragState | null>(null)

  useEffect(() => {
    previewUrlRef.current = previewUrl
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (ownsPreviewUrlRef.current && previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const start = useCallback((url: string, origin: CropOrigin) => {
    if (ownsPreviewUrlRef.current && previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    originRef.current = origin
    ownsPreviewUrlRef.current = origin.ownsPreviewUrl
    previewImageRef.current = null
    dragRef.current = null
    setPreviewUrl(url)
    setGeometry(null)
    setError(null)
    setIsOpen(true)
  }, [])

  // 動画は、切り取り中に映像が進んでプレビューと保存結果がずれないよう一時停止する。
  // プレビューは表示用に再エンコードするが、保存時は劣化のない映像から直接切り取る
  const openVideoFrame = useCallback(
    async (video: HTMLVideoElement) => {
      onPause()
      setError(null)

      try {
        const blob = await captureFrameToBlob(video)
        start(URL.createObjectURL(blob), {
          drawFrom: {
            source: video,
            size: { width: video.videoWidth, height: video.videoHeight },
          },
          ownsPreviewUrl: true,
          // 一部のモバイルブラウザでwebpが保存できないため動画側はjpg
          format: 'jpeg',
        })
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'フレームの取得に失敗しました。',
        )
      }
    },
    [onPause, start],
  )

  const openImage = useCallback(
    (objectUrl: string) => {
      start(objectUrl, {
        drawFrom: null,
        ownsPreviewUrl: false,
        format: 'webp',
      })
    },
    [start],
  )

  const close = useCallback(() => {
    dragRef.current = null
    previewImageRef.current = null
    originRef.current = null

    if (ownsPreviewUrlRef.current && previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    ownsPreviewUrlRef.current = false

    setPreviewUrl(null)
    setGeometry(null)
    setIsOpen(false)
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
        const scaleX = display.width / previous.display.width
        const scaleY = display.height / previous.display.height
        return {
          display,
          crop: {
            x: previous.crop.x * scaleX,
            y: previous.crop.y * scaleY,
            width: previous.crop.width * scaleX,
            height: previous.crop.height * scaleY,
          },
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
                presetRatio(ASPECT_PRESETS[presetIndex]),
                previous.display,
              )

        return { ...previous, crop }
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

  // 保存できたかどうかを返し、閉じるか次へ進むかは呼び出し元に委ねる
  const confirm = useCallback(async (): Promise<boolean> => {
    const origin = originRef.current
    const previewImage = previewImageRef.current
    if (!origin || !geometry) {
      return false
    }

    const drawFrom =
      origin.drawFrom ??
      (previewImage
        ? {
            source: previewImage,
            size: {
              width: previewImage.naturalWidth,
              height: previewImage.naturalHeight,
            },
          }
        : null)

    if (!drawFrom) {
      return false
    }

    const preset = ASPECT_PRESETS[presetIndex]
    const sourceRect = toSourceRect(
      geometry.crop,
      geometry.display,
      drawFrom.size,
    )

    return save(() =>
      cropToBlob(
        drawFrom.source,
        sourceRect,
        { width: preset.width, height: preset.height },
        origin.format,
      ),
    )
  }, [geometry, presetIndex, save])

  return {
    isOpen,
    previewUrl,
    presetIndex,
    crop: geometry?.crop ?? null,
    error,
    openVideoFrame,
    openImage,
    close,
    measure,
    selectPreset,
    beginDrag,
    handlePointerMove,
    endDrag,
    confirm,
  }
}
