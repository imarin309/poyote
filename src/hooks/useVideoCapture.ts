import { useCallback, useEffect, useRef, useState } from 'react'
import { captureFrameToBlob } from '../services/captureFrame'
import { downloadBlob } from '../services/downloadImage'
import { buildCaptureFilename } from '../utils/fileName'

interface LastCapture {
  objectUrl: string
  filename: string
  timeSeconds: number
}

interface UseVideoCaptureOptions {
  videoNode: HTMLVideoElement | null
  baseFileName: string
  videoKey: string | null
}

export function useVideoCapture({
  videoNode,
  baseFileName,
  videoKey,
}: UseVideoCaptureOptions) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCapture, setLastCapture] = useState<LastCapture | null>(null)
  const [syncedVideoKey, setSyncedVideoKey] = useState(videoKey)
  const lastCaptureRef = useRef<LastCapture | null>(null)

  // 別の動画へ切り替えたとき、前の動画のキャプチャ結果を残さない。
  // Object URLの解放はrefを触るためレンダー本体では行えず、下のeffectに任せる
  if (videoKey !== syncedVideoKey) {
    setSyncedVideoKey(videoKey)
    setLastCapture(null)
    setError(null)
  }

  useEffect(() => {
    lastCaptureRef.current = lastCapture
  }, [lastCapture])

  useEffect(() => {
    return () => {
      if (lastCaptureRef.current) {
        URL.revokeObjectURL(lastCaptureRef.current.objectUrl)
        lastCaptureRef.current = null
      }
    }
  }, [videoKey])

  const capture = useCallback(async () => {
    if (!videoNode || isSaving) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const timeSeconds = videoNode.currentTime
      const blob = await captureFrameToBlob(videoNode)
      const filename = buildCaptureFilename(baseFileName)
      downloadBlob(blob, filename)

      setLastCapture((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous.objectUrl)
        }
        return { objectUrl: URL.createObjectURL(blob), filename, timeSeconds }
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '画像の保存に失敗しました。',
      )
    } finally {
      setIsSaving(false)
    }
  }, [videoNode, baseFileName, isSaving])

  return { capture, isSaving, error, lastCapture }
}
