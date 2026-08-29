import { useCallback, useEffect, useRef, useState } from 'react'
import { downloadBlob } from '../services/downloadImage'
import { buildCaptureFilename } from '../utils/fileName'

export interface LastCapture {
  objectUrl: string
  filename: string
}

export function useCaptureSave(baseFileName: string) {
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

  const save = useCallback(
    async (createBlob: () => Promise<Blob>): Promise<boolean> => {
      if (isSaving) {
        return false
      }

      setIsSaving(true)
      setError(null)

      try {
        const blob = await createBlob()
        const filename = buildCaptureFilename(baseFileName, blob.type)
        downloadBlob(blob, filename)

        setLastCapture((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous.objectUrl)
          }
          return { objectUrl: URL.createObjectURL(blob), filename }
        })
        return true
      } catch (err) {
        setError(
          err instanceof Error ? err.message : '画像の保存に失敗しました。',
        )
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [baseFileName, isSaving],
  )

  return { save, isSaving, error, lastCapture }
}
