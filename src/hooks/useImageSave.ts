import { useCallback, useEffect, useRef, useState } from 'react'
import { downloadBlob } from '../services/downloadImage'
import { buildCaptureFilename } from '../utils/fileName'

// ファイル名は空にできるため、そのまま渡すと「.jpg」になってしまう
const DEFAULT_BASE_FILE_NAME = 'image'

export interface SavedImage {
  objectUrl: string
  filename: string
}

export function useImageSave(baseFileName: string) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<SavedImage | null>(null)
  const lastSavedRef = useRef<SavedImage | null>(null)

  useEffect(() => {
    lastSavedRef.current = lastSaved
  }, [lastSaved])

  useEffect(() => {
    return () => {
      if (lastSavedRef.current) {
        URL.revokeObjectURL(lastSavedRef.current.objectUrl)
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
        const filename = buildCaptureFilename(
          baseFileName.trim() || DEFAULT_BASE_FILE_NAME,
        )
        downloadBlob(blob, filename)

        setLastSaved((previous) => {
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

  return { save, isSaving, error, lastSaved }
}
