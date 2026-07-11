import { useCallback, useEffect, useRef, useState } from 'react'
import type { LoadedVideo } from '../types/video'
import { isVideoFile } from '../utils/validateVideoFile'

export function useVideoFile() {
  const [video, setVideo] = useState<LoadedVideo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const loadFile = useCallback((file: File) => {
    if (!isVideoFile(file)) {
      setError('動画ファイルを選択してください。')
      return
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }

    const objectUrl = URL.createObjectURL(file)
    objectUrlRef.current = objectUrl
    setError(null)
    setVideo({ file, objectUrl })
  }, [])

  const reportPlaybackError = useCallback(() => {
    setError('この動画はブラウザで再生できません。')
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setVideo(null)
  }, [])

  const clear = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setVideo(null)
    setError(null)
  }, [])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  return { video, error, loadFile, reportPlaybackError, clear }
}
