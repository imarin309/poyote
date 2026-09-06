import { useCallback, useEffect, useRef, useState } from 'react'
import type { LoadedVideo } from '../types/video'
import { isVideoFile } from '../utils/validateVideoFile'

interface QueueState {
  videos: LoadedVideo[]
  index: number
  unplayableUrls: string[]
}

const EMPTY: QueueState = { videos: [], index: 0, unplayableUrls: [] }

export function useVideoFiles() {
  const [state, setState] = useState<QueueState>(EMPTY)
  const [loadError, setLoadError] = useState<string | null>(null)
  const objectUrlsRef = useRef<string[]>([])

  const revokeAll = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrlsRef.current = []
  }, [])

  useEffect(() => {
    return revokeAll
  }, [revokeAll])

  const load = useCallback(
    (files: File[]) => {
      const videoFiles = files.filter(isVideoFile)

      if (videoFiles.length === 0) {
        setLoadError('動画ファイルを選択してください。')
        return
      }

      revokeAll()

      const videos = videoFiles.map((file) => {
        const objectUrl = URL.createObjectURL(file)
        objectUrlsRef.current.push(objectUrl)
        return { file, objectUrl }
      })

      // この警告はドロップゾーンだけに出すと、読み込み成功と同時に
      // ドロップゾーンが消えて誰にも見えないので、読み込み後の画面にも流す
      setLoadError(
        videoFiles.length < files.length
          ? `動画でないファイル${files.length - videoFiles.length}件を除外しました。`
          : null,
      )
      setState({ videos, index: 0, unplayableUrls: [] })
    },
    [revokeAll],
  )

  const select = useCallback((index: number) => {
    setState((previous) => {
      if (previous.videos.length === 0) {
        return previous
      }

      const clamped = Math.min(Math.max(index, 0), previous.videos.length - 1)
      return clamped === previous.index
        ? previous
        : { ...previous, index: clamped }
    })
  }, [])

  // リストから外すと並びがずれ、どのファイルが落ちたのか分からなくなるため、
  // 再生できなかった動画も残して印だけ付ける
  const reportPlaybackError = useCallback(() => {
    setState((previous) => {
      const current = previous.videos[previous.index]
      if (!current || previous.unplayableUrls.includes(current.objectUrl)) {
        return previous
      }

      return {
        ...previous,
        unplayableUrls: [...previous.unplayableUrls, current.objectUrl],
      }
    })
  }, [])

  const clear = useCallback(() => {
    revokeAll()
    setState(EMPTY)
    setLoadError(null)
  }, [revokeAll])

  const isUnplayable = useCallback(
    (video: LoadedVideo) => state.unplayableUrls.includes(video.objectUrl),
    [state.unplayableUrls],
  )

  const current = state.videos[state.index] ?? null

  // 再生エラーはstateに持たず選択中の動画から導出する。別の動画へ切り替えれば
  // 消え、再生できない動画へ戻れば再び出る
  const playbackError =
    current && state.unplayableUrls.includes(current.objectUrl)
      ? `${current.file.name} はブラウザで再生できません。`
      : null

  return {
    videos: state.videos,
    current,
    index: state.index,
    total: state.videos.length,
    isUnplayable,
    error: playbackError ?? loadError,
    load,
    select,
    reportPlaybackError,
    clear,
  }
}
