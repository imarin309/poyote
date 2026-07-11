import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { captureThumbnailBlob } from '../services/captureThumbnail'
import { seekAndWait } from '../services/seekVideo'
import type { Thumbnail } from '../types/video'
import { buildThumbnailTimes, resolveThumbnailInterval } from '../utils/thumbnailPlan'

interface ThumbnailProgress {
  current: number
  total: number
}

function revokeAll(thumbnails: Thumbnail[]) {
  thumbnails.forEach((thumbnail) => URL.revokeObjectURL(thumbnail.objectUrl))
}

export function useThumbnailGeneration(
  videoNodeRef: RefObject<HTMLVideoElement | null>,
  videoKey: string | null,
  duration: number,
) {
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([])
  const [progress, setProgress] = useState<ThumbnailProgress>({ current: 0, total: 0 })
  const [isGenerating, setIsGenerating] = useState(false)
  const [syncedVideoKey, setSyncedVideoKey] = useState<string | null>(null)
  const generatedForKeyRef = useRef<string | null>(null)
  const thumbnailsRef = useRef<Thumbnail[]>([])

  if (videoKey !== syncedVideoKey) {
    setSyncedVideoKey(videoKey)
    setThumbnails([])
    setProgress({ current: 0, total: 0 })
  }

  useEffect(() => {
    return () => {
      revokeAll(thumbnailsRef.current)
      thumbnailsRef.current = []
      generatedForKeyRef.current = null
    }
  }, [videoKey])

  useEffect(() => {
    const node = videoNodeRef.current
    if (!node || !videoKey || duration <= 0) {
      return
    }

    if (generatedForKeyRef.current === videoKey) {
      return
    }
    generatedForKeyRef.current = videoKey

    let cancelled = false

    const run = async () => {
      const interval = resolveThumbnailInterval(duration)
      const times = buildThumbnailTimes(duration, interval)
      const originalTime = node.currentTime
      const results: Thumbnail[] = []

      setIsGenerating(true)
      setProgress({ current: 0, total: times.length })

      for (let index = 0; index < times.length; index += 1) {
        if (cancelled) {
          break
        }

        const time = times[index]
        try {
          await seekAndWait(node, time)
          const blob = await captureThumbnailBlob(node)
          results.push({ time, objectUrl: URL.createObjectURL(blob) })
        } catch {
          // 生成に失敗したフレームだけスキップし、残りの生成を続ける
        }

        if (!cancelled) {
          thumbnailsRef.current = [...results]
          setThumbnails(thumbnailsRef.current)
          setProgress({ current: index + 1, total: times.length })
        }
      }

      if (!cancelled) {
        node.currentTime = originalTime
        setIsGenerating(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [videoNodeRef, videoKey, duration])

  return { thumbnails, isGenerating, progress }
}
