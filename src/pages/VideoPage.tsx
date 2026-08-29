import { useCallback, useState } from 'react'
import { useVideoFile } from '../hooks/useVideoFile'
import { usePlaybackControls } from '../hooks/usePlaybackControls'
import { useCaptureSave } from '../hooks/useCaptureSave'
import { useVideoCapture } from '../hooks/useVideoCapture'
import { useCropEditor } from '../hooks/useCropEditor'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useThumbnailGeneration } from '../hooks/useThumbnailGeneration'
import { VideoDropZone } from '../components/VideoDropZone/VideoDropZone'
import { VideoPlayer } from '../components/VideoPlayer/VideoPlayer'
import { PlaybackControls } from '../components/PlaybackControls/PlaybackControls'
import { CapturePreview } from '../components/CapturePreview/CapturePreview'
import { CropModal } from '../components/CropModal/CropModal'
import { ThumbnailGrid } from '../components/ThumbnailGrid/ThumbnailGrid'
import { Header } from '../components/Header/Header'
import { stripExtension } from '../utils/fileName'
import type { Route } from '../types/route'

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
  const [baseFileName, setBaseFileName] = useState('')
  const [syncedVideoUrl, setSyncedVideoUrl] = useState<string | null>(null)

  const {
    video,
    error: videoError,
    loadFile,
    reportPlaybackError,
    clear,
  } = useVideoFile()

  const {
    videoRef,
    videoNode,
    videoNodeRef,
    currentTime,
    duration,
    isPaused,
    seekBy,
    seekTo,
    pause,
    togglePlayPause,
  } = usePlaybackControls()

  const currentVideoUrl = video?.objectUrl ?? null
  if (currentVideoUrl !== syncedVideoUrl) {
    setSyncedVideoUrl(currentVideoUrl)
    setBaseFileName(video ? stripExtension(video.file.name) : '')
  }

  const {
    save,
    isSaving,
    error: saveError,
    lastCapture,
  } = useCaptureSave(baseFileName)
  const { capture } = useVideoCapture({ videoNode, save })
  const crop = useCropEditor({ onPause: pause, save })
  const { openVideoFrame, close: closeCrop, error: cropError } = crop

  const { thumbnails, isGenerating, progress } = useThumbnailGeneration(
    videoNodeRef,
    currentVideoUrl,
    duration,
  )

  useKeyboardShortcuts({
    enabled: video !== null && !isGenerating && !helpOpen && !crop.isOpen,
    onSeek: seekBy,
    onTogglePlayPause: togglePlayPause,
    onCapture: capture,
  })

  const openVideoCrop = useCallback(() => {
    if (videoNodeRef.current) {
      void openVideoFrame(videoNodeRef.current)
    }
  }, [videoNodeRef, openVideoFrame])

  const handleCropConfirm = useCallback(async () => {
    const saved = await crop.confirm()
    if (saved) {
      closeCrop()
    }
  }, [crop, closeCrop])

  const header = (
    <Header
      bordered={video !== null}
      route={route}
      onNavigate={onNavigate}
      onOpenHelp={onOpenHelp}
    />
  )

  const cropModal = crop.isOpen && (
    <CropModal
      previewUrl={crop.previewUrl}
      presetIndex={crop.presetIndex}
      crop={crop.crop}
      isSaving={isSaving}
      error={saveError}
      onSelectPreset={crop.selectPreset}
      onMeasure={crop.measure}
      onBeginDrag={crop.beginDrag}
      onPointerMove={crop.handlePointerMove}
      onEndDrag={crop.endDrag}
      onConfirm={handleCropConfirm}
      onClose={closeCrop}
    />
  )

  if (!video) {
    return (
      <div className="flex min-h-screen flex-col items-center gap-8 bg-neutral-950 px-4 py-10 text-neutral-100">
        {header}
        <div className="flex flex-1 items-center justify-center">
          <VideoDropZone onFileSelected={loadFile} error={videoError} />
        </div>
        {cropModal}
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-100">
      {header}

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
            onChangeVideo={clear}
          />
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
            onOpenCrop={openVideoCrop}
            isSaving={isSaving}
            disabled={isGenerating}
            error={saveError ?? cropError}
            lastCapture={lastCapture}
          />
        </div>
      </div>

      {cropModal}
    </div>
  )
}
