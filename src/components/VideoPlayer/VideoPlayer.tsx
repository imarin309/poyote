import type { LoadedVideo } from '../../types/video'

interface VideoPlayerProps {
  video: LoadedVideo
  videoRef: (node: HTMLVideoElement | null) => void
  onError: () => void
  onChangeVideo: () => void
}

export function VideoPlayer({
  video,
  videoRef,
  onError,
  onChangeVideo,
}: VideoPlayerProps) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <p
          className="truncate text-sm text-neutral-300"
          title={video.file.name}
        >
          {video.file.name}
        </p>
        <button
          type="button"
          onClick={onChangeVideo}
          className="shrink-0 rounded-md border border-neutral-600 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800"
        >
          動画を変更
        </button>
      </div>

      <video
        key={video.objectUrl}
        ref={videoRef}
        data-testid="video-element"
        src={video.objectUrl}
        controls
        className="w-full rounded-md bg-black"
        onError={onError}
      />
    </div>
  )
}
