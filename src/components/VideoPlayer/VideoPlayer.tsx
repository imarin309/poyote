import type { LoadedVideo } from '../../types/video'

interface VideoPlayerProps {
  video: LoadedVideo
  videoRef: (node: HTMLVideoElement | null) => void
  onError: () => void
}

export function VideoPlayer({ video, videoRef, onError }: VideoPlayerProps) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <p className="truncate text-sm text-neutral-300" title={video.file.name}>
        {video.file.name}
      </p>

      <video
        key={video.objectUrl}
        ref={videoRef}
        data-testid="video-element"
        src={video.objectUrl}
        controls
        playsInline
        className="w-full rounded-md bg-black"
        onError={onError}
      />
    </div>
  )
}
