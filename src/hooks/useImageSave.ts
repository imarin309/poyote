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
  // isSaving(state)はレンダーを挟むまで更新されないので、同じタイミングで
  // 二重に呼ばれた場合の多重実行はrefで止める
  const isSavingRef = useRef(false)

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
      if (isSavingRef.current) {
        return false
      }

      isSavingRef.current = true
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
        isSavingRef.current = false
        setIsSaving(false)
      }
    },
    [baseFileName],
  )

  return { save, isSaving, error, lastSaved }
}
