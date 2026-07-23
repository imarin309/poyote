import { useState } from 'react'
import { useVideoFile } from './hooks/useVideoFile'
import { usePlaybackControls } from './hooks/usePlaybackControls'
import { useVideoCapture } from './hooks/useVideoCapture'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useThumbnailGeneration } from './hooks/useThumbnailGeneration'
import { VideoDropZone } from './components/VideoDropZone/VideoDropZone'
import { VideoPlayer } from './components/VideoPlayer/VideoPlayer'
import { PlaybackControls } from './components/PlaybackControls/PlaybackControls'
import { CapturePreview } from './components/CapturePreview/CapturePreview'
import { ThumbnailGrid } from './components/ThumbnailGrid/ThumbnailGrid'
import { Header } from './components/Header/Header'
import { HelpTour } from './components/HelpTour/HelpTour'
import { stripExtension } from './utils/fileName'

function App() {
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
    togglePlayPause,
  } = usePlaybackControls()

  const [baseFileName, setBaseFileName] = useState('')
  const [syncedVideoUrl, setSyncedVideoUrl] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

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
  } = useVideoCapture({ videoNode, baseFileName })

  const { thumbnails, isGenerating, progress } = useThumbnailGeneration(
    videoNodeRef,
    currentVideoUrl,
    duration,
  )

  useKeyboardShortcuts({
    enabled: video !== null && !isGenerating && !helpOpen,
    onSeek: seekBy,
    onTogglePlayPause: togglePlayPause,
    onCapture: capture,
  })

  if (!video) {
    return (
      <div className="flex min-h-screen flex-col items-center gap-8 bg-neutral-950 px-4 py-10 text-neutral-100">
        <Header onOpenHelp={() => setHelpOpen(true)} />
        <div className="flex flex-1 items-center justify-center">
          <VideoDropZone onFileSelected={loadFile} error={videoError} />
        </div>
        {helpOpen && <HelpTour onClose={() => setHelpOpen(false)} />}
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-100">
      <Header bordered onOpenHelp={() => setHelpOpen(true)} />

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex flex-col items-center gap-6 overflow-y-auto p-6 md:w-1/2">
          <ThumbnailGrid
            thumbnails={thumbnails}
            isGenerating={isGenerating}
            progress={progress}
            onSeek={seekTo}
          />
        </div>

        <div className="flex flex-col items-center gap-4 overflow-y-auto border-neutral-800 p-6 md:w-1/2 md:border-l">
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
            isSaving={isSaving}
            disabled={isGenerating}
            error={captureError}
            lastCapture={lastCapture}
          />
        </div>
      </div>

      {helpOpen && <HelpTour onClose={() => setHelpOpen(false)} />}
    </div>
  )
}

export default App
