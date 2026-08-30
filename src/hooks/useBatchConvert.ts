import { useCallback, useRef, useState } from 'react'
import { convertImageToBlob } from '../services/convertImage'
import { createZip } from '../services/createZip'
import { downloadBlob } from '../services/downloadImage'
import {
  buildImageFilename,
  buildZipFilename,
  stripExtension,
} from '../utils/fileName'
import { MAX_OUTPUT_BYTES } from '../utils/imageQuality'
import type { LoadedImage } from '../types/image'
import type { ZipEntry } from '../services/createZip'

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
  // 保存できたZIPのファイル名。1件も変換できなかったときはnullのまま
  const [zipFilename, setZipFilename] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // isRunning(state)はレンダーを挟むまで更新されないため、多重実行はrefで止める
  const isRunningRef = useRef(false)

  const run = useCallback(async (images: LoadedImage[]) => {
    if (images.length === 0 || isRunningRef.current) {
      return
    }

    isRunningRef.current = true
    setIsRunning(true)
    setResults([])
    setZipFilename(null)
    setError(null)
    setProgress({ current: 0, total: images.length })

    const converted: ConvertResult[] = []
    const entries: ZipEntry[] = []

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

          entries.push({ filename, blob })
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

      // 1件ずつダウンロードするとブラウザに2件目以降を止められるため、
      // 変換できた分をZIPにまとめて1回だけ保存する
      if (entries.length > 0) {
        const filename = buildZipFilename()
        downloadBlob(await createZip(entries), filename)
        setZipFilename(filename)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ZIPの作成に失敗しました。')
    } finally {
      isRunningRef.current = false
      setIsRunning(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResults([])
    setZipFilename(null)
    setError(null)
    setProgress(EMPTY_PROGRESS)
  }, [])

  return { isRunning, progress, results, zipFilename, error, run, reset }
}
