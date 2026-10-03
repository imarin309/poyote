import { useCallback, useEffect, useRef, useState } from 'react'
import { loadImageElement } from '../services/loadImageElement'
import { drawRotated } from '../services/rotateImage'
import { nextRotation } from '../utils/rotation'
import type { RotateDirection, Rotation } from '../utils/rotation'

// 回した画像は元画像とは縦横比が変わるので、切り取り範囲を作り直してもらう。
// 角度の更新と同じレンダーにまとめるため、setRotationの直前に呼ぶ
export function useImageRotation(
  sourceUrl: string | null,
  onRotated: () => void,
) {
  const [rotation, setRotation] = useState<Rotation>(0)
  // 回すたびにデコードし直さないよう、1枚につき最初の1回だけ読み込んで使い回す
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null)
  const [isRotating, setIsRotating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncedSourceUrl, setSyncedSourceUrl] = useState(sourceUrl)
  // 読み込み中に画像が切り替わったら、遅れて届いた古い結果は捨てる
  const requestIdRef = useRef(0)

  if (sourceUrl !== syncedSourceUrl) {
    setSyncedSourceUrl(sourceUrl)
    setRotation(0)
    setSourceImage(null)
    setIsRotating(false)
    setError(null)
  }

  useEffect(() => {
    return () => {
      requestIdRef.current += 1
    }
  }, [sourceUrl])

  const rotate = useCallback(
    async (direction: RotateDirection) => {
      if (!sourceUrl) {
        return
      }

      const next = nextRotation(rotation, direction)
      setError(null)

      if (next === 0 || sourceImage) {
        onRotated()
        setRotation(next)
        return
      }

      requestIdRef.current += 1
      const requestId = requestIdRef.current
      setIsRotating(true)

      try {
        const image = await loadImageElement(sourceUrl)
        if (requestId !== requestIdRef.current) {
          return
        }
        if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
          throw new Error('画像のサイズを取得できませんでした。')
        }
        onRotated()
        setSourceImage(image)
        setRotation(next)
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return
        }
        setError(
          err instanceof Error ? err.message : '画像の回転に失敗しました。',
        )
      } finally {
        if (requestId === requestIdRef.current) {
          setIsRotating(false)
        }
      }
    },
    [onRotated, rotation, sourceImage, sourceUrl],
  )

  // iOS Safariなどは大きすぎるcanvasのコンテキストを返さないため、
  // 描けなかったら回転エラーにして元の向きに戻す
  const drawPreview = useCallback(
    (canvas: HTMLCanvasElement): boolean => {
      if (rotation === 0 || !sourceImage) {
        return false
      }

      try {
        drawRotated(canvas, sourceImage, rotation)
        return true
      } catch (err) {
        onRotated()
        setRotation(0)
        setError(
          err instanceof Error ? err.message : '画像の回転に失敗しました。',
        )
        return false
      }
    },
    [onRotated, rotation, sourceImage],
  )

  return {
    isRotated: rotation !== 0 && sourceImage !== null,
    isRotating,
    error,
    rotate,
    drawPreview,
  }
}
