import { useCallback } from 'react'
import { captureFrameToBlob } from '../services/captureFrame'

interface UseVideoCaptureOptions {
  videoNode: HTMLVideoElement | null
  save: (createBlob: () => Promise<Blob>) => Promise<boolean>
}

export function useVideoCapture({ videoNode, save }: UseVideoCaptureOptions) {
  const capture = useCallback(async () => {
    if (!videoNode) {
      return
    }

    await save(() => captureFrameToBlob(videoNode))
  }, [videoNode, save])

  return { capture }
}
