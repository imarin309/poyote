import { useCallback, useEffect, useRef, useState } from 'react'
import type { LoadedImage } from '../types/image'
import { isImageFile } from '../utils/validateImageFile'

export function useImageFile() {
  const [image, setImage] = useState<LoadedImage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  // 読み込み直後にそのまま切り取りを開始できるよう、読み込んだ画像を返す
  const loadFile = useCallback((file: File): LoadedImage | null => {
    if (!isImageFile(file)) {
      setError('画像ファイルを選択してください。')
      return null
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }

    const objectUrl = URL.createObjectURL(file)
    objectUrlRef.current = objectUrl
    const loaded = { file, objectUrl }
    setError(null)
    setImage(loaded)
    return loaded
  }, [])

  const clear = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setImage(null)
    setError(null)
  }, [])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  return { image, error, loadFile, clear }
}
