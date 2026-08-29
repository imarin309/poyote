import { useCallback, useEffect, useRef, useState } from 'react'
import type { LoadedImage } from '../types/image'
import { isImageFile } from '../utils/validateImageFile'

interface QueueState {
  images: LoadedImage[]
  index: number
  savedCount: number
  skippedCount: number
}

const EMPTY: QueueState = {
  images: [],
  index: 0,
  savedCount: 0,
  skippedCount: 0,
}

export function useImageQueue() {
  const [state, setState] = useState<QueueState>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const objectUrlsRef = useRef<string[]>([])

  const revokeAll = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrlsRef.current = []
  }, [])

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current = []
    }
  }, [])

  // 読み込み直後にそのまま切り取りを開始できるよう、先頭の画像を返す
  const load = useCallback(
    (files: File[]): LoadedImage | null => {
      const imageFiles = files.filter(isImageFile)

      if (imageFiles.length === 0) {
        setError('画像ファイルを選択してください。')
        return null
      }

      revokeAll()

      const images = imageFiles.map((file) => {
        const objectUrl = URL.createObjectURL(file)
        objectUrlsRef.current.push(objectUrl)
        return { file, objectUrl }
      })

      setError(
        imageFiles.length < files.length
          ? `画像でないファイル${files.length - imageFiles.length}件を除外しました。`
          : null,
      )
      setState({ images, index: 0, savedCount: 0, skippedCount: 0 })
      return images[0]
    },
    [revokeAll],
  )

  // 次の対象を返す。最後まで進んだ場合は null。
  // setState の更新関数は同期実行されないため、次の画像はレンダー時点の state から求める
  const advance = useCallback(
    (saved: boolean): LoadedImage | null => {
      const nextIndex = state.index + 1

      setState((previous) => ({
        ...previous,
        index: previous.index + 1,
        savedCount: previous.savedCount + (saved ? 1 : 0),
        skippedCount: previous.skippedCount + (saved ? 0 : 1),
      }))

      return state.images[nextIndex] ?? null
    },
    [state],
  )

  // 読み込んだ画像は保持したまま、トリミングの進行状況だけ最初に戻す
  const restart = useCallback(() => {
    setState((previous) => ({
      ...previous,
      index: 0,
      savedCount: 0,
      skippedCount: 0,
    }))
  }, [])

  const clear = useCallback(() => {
    revokeAll()
    setState(EMPTY)
    setError(null)
  }, [revokeAll])

  const current = state.images[state.index] ?? null

  return {
    images: state.images,
    current,
    index: state.index,
    total: state.images.length,
    savedCount: state.savedCount,
    skippedCount: state.skippedCount,
    isFinished: state.images.length > 0 && state.index >= state.images.length,
    error,
    load,
    advance,
    restart,
    clear,
  }
}
