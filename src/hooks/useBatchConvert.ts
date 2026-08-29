import { useCallback, useState } from 'react'
import { convertToLighterBlob } from '../services/convertImage'
import { downloadBlob } from '../services/downloadImage'
import { buildCaptureFilename, stripExtension } from '../utils/fileName'
import { MAX_OUTPUT_BYTES } from '../utils/imageQuality'
import type { LoadedImage } from '../types/image'

export interface ConvertResult {
  filename: string
  bytes: number
  withinLimit: boolean
}

export function useBatchConvert() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<ConvertResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (images: LoadedImage[]) => {
    if (images.length === 0) {
      return
    }

    setIsRunning(true)
    setError(null)
    setResults([])
    setProgress({ current: 0, total: images.length })

    const converted: ConvertResult[] = []

    try {
      for (let index = 0; index < images.length; index += 1) {
        const image = images[index]
        const blob = await convertToLighterBlob(image.objectUrl)
        const filename = buildCaptureFilename(
          stripExtension(image.file.name),
          blob.type,
        )

        downloadBlob(blob, filename)
        converted.push({
          filename,
          bytes: blob.size,
          withinLimit: blob.size <= MAX_OUTPUT_BYTES,
        })

        setResults([...converted])
        setProgress({ current: index + 1, total: images.length })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '一括変換に失敗しました。')
    } finally {
      setIsRunning(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResults([])
    setProgress({ current: 0, total: 0 })
    setError(null)
  }, [])

  return { isRunning, progress, results, error, run, reset }
}
