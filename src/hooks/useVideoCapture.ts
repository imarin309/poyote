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
}

export function useVideoCapture({
  videoNode,
  baseFileName,
}: UseVideoCaptureOptions) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCapture, setLastCapture] = useState<LastCapture | null>(null)
  const lastCaptureRef = useRef<LastCapture | null>(null)

  useEffect(() => {
    lastCaptureRef.current = lastCapture
  }, [lastCapture])

  useEffect(() => {
    return () => {
      if (lastCaptureRef.current) {
        URL.revokeObjectURL(lastCaptureRef.current.objectUrl)
      }
    }
  }, [])

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
