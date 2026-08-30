import { useCallback, useEffect, useRef, useState } from 'react'
import { downloadBlob } from '../services/downloadImage'
import { buildImageFilename } from '../utils/fileName'

// ファイル名は空にできるため、そのまま渡すと「.webp」になってしまう
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
        // 拡張子は指定した形式ではなく、実際に生成できた形式から決める
        const filename = buildImageFilename(
          baseFileName.trim() || DEFAULT_BASE_FILE_NAME,
          blob.type,
        )
        downloadBlob(blob, filename)

        // StrictModeはsetStateの更新関数を2回呼ぶため、その中でObject URLを
        // 作ると捨てられる方が解放されずに残る。更新関数の外で作って差し替える
        if (lastSavedRef.current) {
          URL.revokeObjectURL(lastSavedRef.current.objectUrl)
        }
        const saved = { objectUrl: URL.createObjectURL(blob), filename }
        lastSavedRef.current = saved
        setLastSaved(saved)
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
