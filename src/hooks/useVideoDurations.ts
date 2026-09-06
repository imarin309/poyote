import { useEffect, useRef, useState } from 'react'
import { measureDuration } from '../services/measureDuration'
import type { LoadedVideo } from '../types/video'

export function useVideoDurations(videos: LoadedVideo[]) {
  const [durations, setDurations] = useState<Map<string, number | null>>(
    () => new Map(),
  )
  const [errorUrls, setErrorUrls] = useState<Set<string>>(() => new Set())
  const measuredUrlsRef = useRef<Set<string>>(new Set())
  const runningRef = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      // videos は読み込みのたびに identity が変わるので、計測済みを覚えておかないと
      // 動画を足すたびに全件を測り直すことになる。直前の実行が測り終えたぶんも
      // 除きたいので、対象は実行開始まで確定させない
      const pending = videos.filter(
        (video) => !measuredUrlsRef.current.has(video.objectUrl),
      )

      // 並列にすると本数ぶんのネイティブデコーダが同時に立つため、必ず1本ずつ測る
      for (const video of pending) {
        if (cancelled) {
          return
        }

        try {
          const seconds = await measureDuration(video.objectUrl)
          if (cancelled) {
            return
          }
          setDurations((previous) =>
            new Map(previous).set(video.objectUrl, seconds),
          )
        } catch {
          if (cancelled) {
            return
          }
          setErrorUrls((previous) => new Set(previous).add(video.objectUrl))
        }

        // 中断した1本を計測済みにすると二度と測られないため、結果を反映してから記録する
        measuredUrlsRef.current.add(video.objectUrl)
      }
    }

    // 中断しても実行中の1本は最後まで走るので、直前の実行の完了を待ってから始める。
    // 待たずに始めると、新旧の実行がデコーダを同時に立てる
    runningRef.current = runningRef.current.then(run)

    return () => {
      cancelled = true
    }
  }, [videos])

  const measuredCount = videos.filter(
    (video) => durations.has(video.objectUrl) || errorUrls.has(video.objectUrl),
  ).length

  // 全件終わってから出すと、本数が多いときにいつまでも合計が出ない
  const totalDuration = videos.reduce(
    (total, video) => total + (durations.get(video.objectUrl) ?? 0),
    0,
  )

  return {
    durations,
    errorUrls,
    totalDuration,
    measuredCount,
    isMeasuring: measuredCount < videos.length,
  }
}
