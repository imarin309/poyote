import { useCallback, useState } from 'react'
import { useImageQueue } from '../hooks/useImageQueue'
import { useBatchConvert } from '../hooks/useBatchConvert'
import { useCaptureSave } from '../hooks/useCaptureSave'
import { useCropEditor } from '../hooks/useCropEditor'
import { ImageDropZone } from '../components/ImageDropZone/ImageDropZone'
import { ImagePanel } from '../components/ImagePanel/ImagePanel'
import { CropModal } from '../components/CropModal/CropModal'
import { Header } from '../components/Header/Header'
import { stripExtension } from '../utils/fileName'
import type { Route } from '../types/route'

interface ImagePageProps {
  route: Route
  onNavigate: (route: Route) => void
  onOpenHelp: () => void
}

export function ImagePage({ route, onNavigate, onOpenHelp }: ImagePageProps) {
  const [baseFileName, setBaseFileName] = useState('')
  const [syncedImageUrl, setSyncedImageUrl] = useState<string | null>(null)

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

  const currentImageUrl = currentImage?.objectUrl ?? null
  if (currentImageUrl !== syncedImageUrl) {
    setSyncedImageUrl(currentImageUrl)
    setBaseFileName(currentImage ? stripExtension(currentImage.file.name) : '')
  }

  const {
    save,
    isSaving,
    error: saveError,
    lastCapture,
  } = useCaptureSave(baseFileName)
  const crop = useCropEditor({ save })
  const { openImage, close: closeCrop, error: cropError } = crop

  const {
    isRunning: isConverting,
    progress: convertProgress,
    results: convertResults,
    error: convertError,
    run: runBatchConvert,
    reset: resetBatchConvert,
  } = useBatchConvert()

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
    if (saved) {
      goToNextImage(true)
    }
  }, [crop, goToNextImage])

  const handleCropClose = useCallback(() => {
    closeCrop()
    // 「全てキャンセル」はトリミングの回を中止するだけで、
    // 読み込んだ画像は一括変換に使えるよう残す
    restartQueue()
  }, [closeCrop, restartQueue])

  const handleChangeImages = useCallback(() => {
    closeCrop()
    clearQueue()
    resetBatchConvert()
  }, [closeCrop, clearQueue, resetBatchConvert])

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-neutral-950 px-4 py-10 text-neutral-100">
      <Header route={route} onNavigate={onNavigate} onOpenHelp={onOpenHelp} />

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
          filename={currentImage?.file.name}
          progress={
            imageTotal > 0
              ? { current: imageIndex + 1, total: imageTotal }
              : undefined
          }
          onSkip={imageTotal > 1 ? () => goToNextImage(false) : undefined}
          onConfirm={handleCropConfirm}
          onClose={handleCropClose}
        />
      )}
    </div>
  )
}
