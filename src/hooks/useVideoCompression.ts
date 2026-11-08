import { useCallback, useEffect, useRef, useState } from 'react'
import { CompressionError, compressVideo } from '../services/compressVideo'
import { extractPoster } from '../services/extractPoster'
import { downloadBlob } from '../services/downloadImage'
import { clampTime } from '../utils/clampTime'
import {
  buildCompressedFilename,
  buildPosterFilename,
} from '../utils/compressionPlan'
import { stripExtension } from '../utils/fileName'
import type {
  CompressionSettings,
  CompressionStatus,
} from '../types/compression'

const IDLE: CompressionStatus = { phase: 'idle' }

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof CompressionError) {
    return error.message
  }

  console.error(error)
  return fallback
}

export function useVideoCompression(file: File | null) {
  const [status, setStatus] = useState<CompressionStatus>(IDLE)
  const [isSavingPoster, setIsSavingPoster] = useState(false)
  const [posterError, setPosterError] = useState<string | null>(null)
  const [syncedFile, setSyncedFile] = useState(file)
  const controllerRef = useRef<AbortController | null>(null)
  const posterControllerRef = useRef<AbortController | null>(null)

  if (file !== syncedFile) {
    setSyncedFile(file)
    setStatus(IDLE)
    setIsSavingPoster(false)
    setPosterError(null)
  }

  const resultUrl = status.phase === 'done' ? status.result.objectUrl : null
  useEffect(() => {
    if (!resultUrl) {
      return
    }

    return () => URL.revokeObjectURL(resultUrl)
  }, [resultUrl])

  // 動画を選び直したときとアンマウント時に、走っている変換とposter生成を止める
  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
      posterControllerRef.current?.abort()
    }
  }, [file])

  const start = useCallback(
    async (settings: CompressionSettings) => {
      if (!file) {
        return
      }

      controllerRef.current?.abort()
      posterControllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setStatus({ phase: 'converting', progress: 0 })
      setIsSavingPoster(false)
      setPosterError(null)

      try {
        const blob = await compressVideo(file, {
          settings,
          signal: controller.signal,
          onProgress: (progress) => {
            if (!controller.signal.aborted) {
              setStatus({ phase: 'converting', progress })
            }
          },
        })
        if (controller.signal.aborted) {
          return
        }

        setStatus({
          phase: 'done',
          result: {
            blob,
            objectUrl: URL.createObjectURL(blob),
            filename: buildCompressedFilename(stripExtension(file.name)),
          },
        })
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setStatus({
          phase: 'error',
          message: toMessage(error, '動画の変換に失敗しました。'),
        })
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null
        }
      }
    },
    [file],
  )

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setStatus(IDLE)
  }, [])

  const saveVideo = useCallback(() => {
    if (status.phase === 'done') {
      downloadBlob(status.result.blob, status.result.filename)
    }
  }, [status])

  const savePoster = useCallback(
    async (timeSeconds: number, duration: number) => {
      if (status.phase !== 'done' || !file) {
        return
      }

      posterControllerRef.current?.abort()
      const controller = new AbortController()
      posterControllerRef.current = controller
      setIsSavingPoster(true)
      setPosterError(null)

      try {
        const poster = await extractPoster(
          status.result.blob,
          clampTime(timeSeconds, duration),
        )
        if (controller.signal.aborted) {
          return
        }

        downloadBlob(
          poster,
          buildPosterFilename(stripExtension(file.name), poster.type),
        )
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setPosterError(toMessage(error, 'posterの保存に失敗しました。'))
      } finally {
        if (posterControllerRef.current === controller) {
          posterControllerRef.current = null
          setIsSavingPoster(false)
        }
      }
    },
    [status, file],
  )

  return {
    status,
    start,
    cancel,
    saveVideo,
    savePoster,
    isSavingPoster,
    posterError,
  }
}
