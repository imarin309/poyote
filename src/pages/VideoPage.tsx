import { useState } from 'react'
import { useVideoFiles } from '../hooks/useVideoFiles'
import { usePlaybackControls } from '../hooks/usePlaybackControls'
import { useVideoCapture } from '../hooks/useVideoCapture'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useThumbnailGeneration } from '../hooks/useThumbnailGeneration'
import { useVideoDurations } from '../hooks/useVideoDurations'
import { VideoDropZone } from '../components/VideoDropZone/VideoDropZone'
import { VideoList } from '../components/VideoList/VideoList'
import { VideoPlayer } from '../components/VideoPlayer/VideoPlayer'
import { PlaybackControls } from '../components/PlaybackControls/PlaybackControls'
import { CapturePreview } from '../components/CapturePreview/CapturePreview'
import { ThumbnailGrid } from '../components/ThumbnailGrid/ThumbnailGrid'
import { Header } from '../components/Header/Header'
import { stripExtension } from '../utils/fileName'
import { formatDuration } from '../utils/formatTime'
import type { Route } from '../types/route'
import type { LoadedVideo } from '../types/video'

interface VideoPageProps {
  route: Route
  onNavigate: (route: Route) => void
  onOpenHelp: () => void
  helpOpen: boolean
}

export function VideoPage({
  route,
  onNavigate,
  onOpenHelp,
  helpOpen,
}: VideoPageProps) {
  const {
    videos,
    current: video,
    index,
    isUnplayable,
    error: videoError,
    load,
    select,
    reportPlaybackError,
    clear,
  } = useVideoFiles()
  const { durations, errorUrls, totalDuration, measuredCount, isMeasuring } =
    useVideoDurations(videos)
  const {
    videoRef,
    videoNode,
    videoNodeRef,
    currentTime,
    duration,
    isPaused,
    seekBy,
    seekTo,
    togglePlayPause,
  } = usePlaybackControls()

  const [baseFileName, setBaseFileName] = useState('')
  const [syncedVideoUrl, setSyncedVideoUrl] = useState<string | null>(null)

  const currentVideoUrl = video?.objectUrl ?? null
  if (currentVideoUrl !== syncedVideoUrl) {
    setSyncedVideoUrl(currentVideoUrl)
    setBaseFileName(video ? stripExtension(video.file.name) : '')
  }

  const {
    capture,
    isSaving,
    error: captureError,
    lastCapture,
  } = useVideoCapture({ videoNode, baseFileName, videoKey: currentVideoUrl })

  const { thumbnails, isGenerating, progress } = useThumbnailGeneration(
    videoNodeRef,
    currentVideoUrl,
    duration,
  )

  // 計測が済んだ動画は、メタデータを読めたかどうかで選ぶ前に再生可否が分かる。
  // ただしメタデータが読めても再生できないコーデックはあるため、onError も残す
  const isVideoUnplayable = (candidate: LoadedVideo) =>
    isUnplayable(candidate) || errorUrls.has(candidate.objectUrl)

  const unknownDurationCount = videos.filter(
    ({ objectUrl }) =>
      errorUrls.has(objectUrl) || durations.get(objectUrl) === null,
  ).length

  useKeyboardShortcuts({
    enabled: video !== null && !isGenerating && !helpOpen,
    onSeek: seekBy,
    onTogglePlayPause: togglePlayPause,
    onCapture: capture,
  })

  const header = (
    <Header
      bordered={video !== null}
      route={route}
      onNavigate={onNavigate}
      onOpenHelp={onOpenHelp}
    />
  )

  if (!video) {
    return (
      <div className="flex min-h-screen flex-col items-center gap-8 bg-neutral-950 px-4 py-10 text-neutral-100">
        {header}
        <div className="flex flex-1 items-center justify-center">
          <VideoDropZone onFilesSelected={load} error={videoError} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-100">
      {header}

      <VideoList
        videos={videos}
        selectedIndex={index}
        durations={durations}
        isUnplayable={isVideoUnplayable}
        onSelect={select}
        onReload={clear}
      />

      <p className="shrink-0 border-b border-neutral-800 px-4 py-1 text-xs text-neutral-400">
        {videos.length}本 / 合計 {formatDuration(totalDuration)}
        {isMeasuring && `（計測中 ${measuredCount}/${videos.length}）`}
        {!isMeasuring &&
          unknownDurationCount > 0 &&
          `（${unknownDurationCount}本は長さ不明）`}
      </p>

      <div className="flex flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        <div className="order-2 flex flex-col items-center gap-6 p-6 md:order-none md:w-1/2 md:overflow-y-auto">
          <ThumbnailGrid
            thumbnails={thumbnails}
            isGenerating={isGenerating}
            progress={progress}
            onSeek={seekTo}
          />
        </div>

        <div className="sticky top-0 z-10 order-1 flex flex-col items-center gap-4 border-neutral-800 bg-neutral-950 p-6 md:static md:order-none md:w-1/2 md:overflow-y-auto md:border-l">
          <VideoPlayer
            video={video}
            videoRef={videoRef}
            onError={reportPlaybackError}
          />
          {videoError && (
            <p role="alert" className="w-full max-w-3xl text-sm text-red-400">
              {videoError}
            </p>
          )}
          <PlaybackControls
            currentTime={currentTime}
            duration={duration}
            isPaused={isPaused}
            disabled={isGenerating}
            onSeek={seekBy}
            onTogglePlayPause={togglePlayPause}
          />
          <CapturePreview
            baseFileName={baseFileName}
            onBaseFileNameChange={setBaseFileName}
            onCapture={capture}
            isSaving={isSaving}
            disabled={isGenerating}
            error={captureError}
            lastCapture={lastCapture}
          />
        </div>
      </div>
    </div>
  )
}
