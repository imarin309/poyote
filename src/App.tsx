import { useCallback, useState } from 'react'
import { useVideoFile } from './hooks/useVideoFile'
import { useImageQueue } from './hooks/useImageQueue'
import { useBatchConvert } from './hooks/useBatchConvert'
import { usePlaybackControls } from './hooks/usePlaybackControls'
import { useCaptureSave } from './hooks/useCaptureSave'
import { useVideoCapture } from './hooks/useVideoCapture'
import { useCropEditor } from './hooks/useCropEditor'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useThumbnailGeneration } from './hooks/useThumbnailGeneration'
import { VideoDropZone } from './components/VideoDropZone/VideoDropZone'
import { ImageDropZone } from './components/ImageDropZone/ImageDropZone'
import { VideoPlayer } from './components/VideoPlayer/VideoPlayer'
import { PlaybackControls } from './components/PlaybackControls/PlaybackControls'
import { CapturePreview } from './components/CapturePreview/CapturePreview'
import { ImagePanel } from './components/ImagePanel/ImagePanel'
import { CropModal } from './components/CropModal/CropModal'
import { ThumbnailGrid } from './components/ThumbnailGrid/ThumbnailGrid'
import { Header } from './components/Header/Header'
import { HelpTour } from './components/HelpTour/HelpTour'
import { stripExtension } from './utils/fileName'
import type { AppMode } from './types/mode'

function App() {
  const [mode, setMode] = useState<AppMode>('video')
  const [baseFileName, setBaseFileName] = useState('')
  const [syncedSourceUrl, setSyncedSourceUrl] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  const {
    video,
    error: videoError,
    loadFile: loadVideoFile,
    reportPlaybackError,
    clear: clearVideo,
  } = useVideoFile()
  const {
    images: queuedImages,
    current: currentImage,
    index: imageIndex,
    total: imageTotal,
    savedCount,
    skippedCount,
    isFinished: isQueueFinished,
    error: imageError,
    load: loadImages,
    advance: advanceQueue,
    restart: restartQueue,
    clear: clearQueue,
  } = useImageQueue()

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

  const activeSource = mode === 'video' ? video : currentImage
  const activeSourceUrl = activeSource?.objectUrl ?? null
  if (activeSourceUrl !== syncedSourceUrl) {
    setSyncedSourceUrl(activeSourceUrl)
    setBaseFileName(activeSource ? stripExtension(activeSource.file.name) : '')
  }

  const {
    save,
    isSaving,
    error: saveError,
    lastCapture,
  } = useCaptureSave(baseFileName)
  const { capture } = useVideoCapture({ videoNode, save })
  const crop = useCropEditor({ onPause: pause, save })
  const {
    isRunning: isConverting,
    progress: convertProgress,
    results: convertResults,
    error: convertError,
    run: runBatchConvert,
    reset: resetBatchConvert,
  } = useBatchConvert()
  const { openVideoFrame, openImage, close: closeCrop, error: cropError } = crop

  // モードを切り替えても生成済みサムネイルを捨てないよう、動画のURLだけをキーにする
  const { thumbnails, isGenerating, progress } = useThumbnailGeneration(
    videoNodeRef,
    video?.objectUrl ?? null,
    duration,
  )

  useKeyboardShortcuts({
    enabled:
      mode === 'video' &&
      video !== null &&
      !isGenerating &&
      !helpOpen &&
      !crop.isOpen,
    onSeek: seekBy,
    onTogglePlayPause: togglePlayPause,
    onCapture: capture,
  })

  const openVideoCrop = useCallback(() => {
    if (videoNodeRef.current) {
      void openVideoFrame(videoNodeRef.current)
    }
  }, [videoNodeRef, openVideoFrame])

  // 読み込み後はトリミングと一括変換のどちらも選べるよう、
  // モーダルは自動で開かず ImagePanel を見せる
  const handleImagesSelected = useCallback(
    (files: File[]) => {
      resetBatchConvert()
      loadImages(files)
    },
    [resetBatchConvert, loadImages],
  )

  // トリミングを挟まず、読み込んだ全件をそのまま容量だけ落として保存する
  const handleConvertAll = useCallback(() => {
    closeCrop()
    void runBatchConvert(queuedImages)
  }, [closeCrop, runBatchConvert, queuedImages])

  // 次の画像があればモーダルを開いたまま送り、なければ完了サマリへ戻る
  const goToNextImage = useCallback(
    (saved: boolean) => {
      const next = advanceQueue(saved)
      if (next) {
        openImage(next.objectUrl)
      } else {
        closeCrop()
      }
    },
    [advanceQueue, openImage, closeCrop],
  )

  const handleCropConfirm = useCallback(async () => {
    const saved = await crop.confirm()
    if (!saved) {
      return
    }

    if (mode === 'image') {
      goToNextImage(true)
    } else {
      closeCrop()
    }
  }, [crop, mode, goToNextImage, closeCrop])

  const handleCropClose = useCallback(() => {
    closeCrop()
    // 「全てキャンセル」はトリミングの回を中止するだけで、
    // 読み込んだ画像は一括変換に使えるよう残す
    if (mode === 'image') {
      restartQueue()
    }
  }, [closeCrop, mode, restartQueue])

  const handleChangeImages = useCallback(() => {
    closeCrop()
    clearQueue()
    resetBatchConvert()
  }, [closeCrop, clearQueue, resetBatchConvert])

  const header = (
    <Header
      bordered={mode === 'video' && video !== null}
      mode={mode}
      onModeChange={setMode}
      onOpenHelp={() => setHelpOpen(true)}
    />
  )

  const overlays = (
    <>
      {crop.isOpen && (
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
          filename={mode === 'image' ? currentImage?.file.name : undefined}
          progress={
            mode === 'image' && imageTotal > 0
              ? { current: imageIndex + 1, total: imageTotal }
              : undefined
          }
          onSkip={
            mode === 'image' && imageTotal > 1
              ? () => goToNextImage(false)
              : undefined
          }
          onConfirm={handleCropConfirm}
          onClose={handleCropClose}
        />
      )}
      {helpOpen && <HelpTour onClose={() => setHelpOpen(false)} />}
    </>
  )

  if (mode === 'image') {
    return (
      <div className="flex min-h-screen flex-col items-center gap-8 bg-neutral-950 px-4 py-10 text-neutral-100">
        {header}
        <div className="flex flex-1 items-center justify-center">
          {imageTotal > 0 ? (
            <ImagePanel
              current={currentImage}
              index={imageIndex}
              total={imageTotal}
              savedCount={savedCount}
              skippedCount={skippedCount}
              isFinished={isQueueFinished}
              baseFileName={baseFileName}
              onBaseFileNameChange={setBaseFileName}
              onResumeCrop={() =>
                currentImage && openImage(currentImage.objectUrl)
              }
              onConvertAll={handleConvertAll}
              onChangeImages={handleChangeImages}
              isSaving={isSaving}
              error={saveError ?? cropError ?? imageError}
              lastCapture={lastCapture}
              isConverting={isConverting}
              convertProgress={convertProgress}
              convertResults={convertResults}
              convertError={convertError}
            />
          ) : (
            <ImageDropZone
              onFilesSelected={handleImagesSelected}
              error={imageError}
            />
          )}
        </div>
        {overlays}
      </div>
    )
  }

  if (!video) {
    return (
      <div className="flex min-h-screen flex-col items-center gap-8 bg-neutral-950 px-4 py-10 text-neutral-100">
        {header}
        <div className="flex flex-1 items-center justify-center">
          <VideoDropZone onFileSelected={loadVideoFile} error={videoError} />
        </div>
        {overlays}
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
            onChangeVideo={clearVideo}
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

      {overlays}
    </div>
  )
}

export default App
