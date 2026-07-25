import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { captureThumbnailBlob } from '../services/captureThumbnail'
import { seekAndWait } from '../services/seekVideo'
import {
  createOffscreenVideo,
  disposeOffscreenVideo,
  waitForMetadata,
} from '../services/offscreenVideo'
import type { Thumbnail } from '../types/video'
import {
  buildThumbnailTimes,
  MAX_THUMBNAIL_COUNT,
  MAX_THUMBNAIL_COUNT_MOBILE,
  resolveThumbnailInterval,
} from '../utils/thumbnailPlan'
import { isMobileDevice } from '../utils/device'

interface ThumbnailProgress {
  current: number
  total: number
}

// 生成を続けるほどネイティブデコーダのメモリが蓄積し、特にメモリ上限の低い
// モバイルではタブごとクラッシュすることがあるため、環境を問わず一定枚数
// ごとに動画要素を作り直して解放し、蓄積をリセットする
const VIDEO_RECYCLE_INTERVAL = 20

function revokeAll(thumbnails: Thumbnail[]) {
  thumbnails.forEach((thumbnail) => URL.revokeObjectURL(thumbnail.objectUrl))
}

export function useThumbnailGeneration(
  videoNodeRef: RefObject<HTMLVideoElement | null>,
  videoKey: string | null,
  duration: number,
) {
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([])
  const [progress, setProgress] = useState<ThumbnailProgress>({
    current: 0,
    total: 0,
  })
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
      const maxCount = isMobileDevice()
        ? MAX_THUMBNAIL_COUNT_MOBILE
        : MAX_THUMBNAIL_COUNT
      const interval = resolveThumbnailInterval(duration, undefined, maxCount)
      const times = buildThumbnailTimes(duration, interval)
      const results: Thumbnail[] = []

      setIsGenerating(true)
      setProgress({ current: 0, total: times.length })

      // 表示中のプレーヤーとは別の動画要素でサムネイルを抽出する。
      // プレーヤー側のシーク位置を乱さずに済み、かつ一定間隔で
      // 作り直すことでネイティブデコーダのメモリ蓄積をリセットできる
      let worker = createOffscreenVideo(videoKey)
      try {
        await waitForMetadata(worker)
      } catch {
        disposeOffscreenVideo(worker)
        generatedForKeyRef.current = null
        if (!cancelled) {
          setIsGenerating(false)
        }
        return
      }

      for (let index = 0; index < times.length; index += 1) {
        if (cancelled) {
          break
        }

        if (index > 0 && index % VIDEO_RECYCLE_INTERVAL === 0) {
          disposeOffscreenVideo(worker)
          worker = createOffscreenVideo(videoKey)
          try {
            await waitForMetadata(worker)
          } catch {
            break
          }
        }

        const time = times[index]
        try {
          await seekAndWait(worker, time)
          const blob = await captureThumbnailBlob(worker)
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

      disposeOffscreenVideo(worker)

      if (!cancelled) {
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
