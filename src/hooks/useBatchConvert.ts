import { useCallback, useRef, useState } from 'react'
import { convertImageToBlob } from '../services/convertImage'
import { downloadBlob } from '../services/downloadImage'
import { buildImageFilename, stripExtension } from '../utils/fileName'
import { MAX_OUTPUT_BYTES } from '../utils/imageQuality'
import type { LoadedImage } from '../types/image'

export interface ConvertResult {
  // 出力したファイル名。失敗したときは元のファイル名を入れる
  filename: string
  bytes: number
  withinLimit: boolean
  error: string | null
}

const EMPTY_PROGRESS = { current: 0, total: 0 }

export function useBatchConvert() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(EMPTY_PROGRESS)
  const [results, setResults] = useState<ConvertResult[]>([])
  // isRunning(state)はレンダーを挟むまで更新されないため、多重実行はrefで止める
  const isRunningRef = useRef(false)

  const run = useCallback(async (images: LoadedImage[]) => {
    if (images.length === 0 || isRunningRef.current) {
      return
    }

    isRunningRef.current = true
    setIsRunning(true)
    setResults([])
    setProgress({ current: 0, total: images.length })

    const converted: ConvertResult[] = []

    try {
      for (const [index, image] of images.entries()) {
        // 1件失敗しても残りは変換したいので、ここで受け止めて一覧に載せる
        try {
          const blob = await convertImageToBlob(image.objectUrl)
          // 拡張子は指定した形式ではなく、実際に生成できた形式から決める
          const filename = buildImageFilename(
            stripExtension(image.file.name),
            blob.type,
          )

          downloadBlob(blob, filename)
          converted.push({
            filename,
            bytes: blob.size,
            withinLimit: blob.size <= MAX_OUTPUT_BYTES,
            error: null,
          })
        } catch (err) {
          converted.push({
            filename: image.file.name,
            bytes: 0,
            withinLimit: false,
            error: err instanceof Error ? err.message : '変換に失敗しました。',
          })
        }

        setResults([...converted])
        setProgress({ current: index + 1, total: images.length })
      }
    } finally {
      isRunningRef.current = false
      setIsRunning(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResults([])
    setProgress(EMPTY_PROGRESS)
  }, [])

  return { isRunning, progress, results, run, reset }
}
