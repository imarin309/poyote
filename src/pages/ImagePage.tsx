import { useCallback, useState } from 'react'
import { useImageQueue } from '../hooks/useImageQueue'
import { useImageSave } from '../hooks/useImageSave'
import { useImageCrop } from '../hooks/useImageCrop'
import { ImageDropZone } from '../components/ImageDropZone/ImageDropZone'
import { ImageEditor } from '../components/ImageEditor/ImageEditor'
import { Header } from '../components/Header/Header'
import { stripExtension } from '../utils/fileName'
import type { Route } from '../types/route'

interface ImagePageProps {
  route: Route
  onNavigate: (route: Route) => void
  onOpenHelp: () => void
}

export function ImagePage({ route, onNavigate, onOpenHelp }: ImagePageProps) {
  const {
    current: image,
    index,
    total,
    savedCount,
    skippedCount,
    isFinished,
    error: queueError,
    load,
    advance,
    cancel,
    restart,
    clear,
  } = useImageQueue()

  const [baseFileName, setBaseFileName] = useState('')
  const [syncedImageUrl, setSyncedImageUrl] = useState<string | null>(null)

  const currentImageUrl = image?.objectUrl ?? null
  if (currentImageUrl !== syncedImageUrl) {
    setSyncedImageUrl(currentImageUrl)
    setBaseFileName(image ? stripExtension(image.file.name) : '')
  }

  const {
    save,
    isSaving,
    error: saveError,
    lastSaved,
  } = useImageSave(baseFileName)
  const crop = useImageCrop({ save })
  const { reset: resetCrop, confirm: confirmCrop } = crop

  // 読み込んだらそのまま切り取り画面になる
  const handleFilesSelected = useCallback(
    (files: File[]) => {
      if (load(files)) {
        resetCrop()
      }
    },
    [load, resetCrop],
  )

  // 画像が変わるので、前の画像の切り取り範囲は捨てて作り直す
  const goToNext = useCallback(
    (saved: boolean) => {
      advance(saved)
      resetCrop()
    },
    [advance, resetCrop],
  )

  const handleSave = useCallback(() => {
    void confirmCrop().then((saved) => {
      if (saved) {
        goToNext(true)
      }
    })
  }, [confirmCrop, goToNext])

  const handleSkip = useCallback(() => {
    goToNext(false)
  }, [goToNext])

  // 「全てキャンセル」はトリミングの回を中止するだけで、
  // 読み込んだ画像は残す（PR6の一括変換で使うため）
  const handleCancelAll = useCallback(() => {
    cancel()
    resetCrop()
  }, [cancel, resetCrop])

  const handleRestart = useCallback(() => {
    restart()
    resetCrop()
  }, [restart, resetCrop])

  const handleChangeImage = useCallback(() => {
    clear()
    resetCrop()
  }, [clear, resetCrop])

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-neutral-950 px-4 py-10 text-neutral-100">
      <Header route={route} onNavigate={onNavigate} onOpenHelp={onOpenHelp} />

      <div className="flex w-full flex-1 items-center justify-center">
        {total > 0 ? (
          <ImageEditor
            image={image}
            index={index}
            total={total}
            savedCount={savedCount}
            skippedCount={skippedCount}
            isFinished={isFinished}
            presetIndex={crop.presetIndex}
            crop={crop.crop}
            baseFileName={baseFileName}
            isSaving={isSaving}
            error={saveError}
            notice={queueError}
            lastSaved={lastSaved}
            onSelectPreset={crop.selectPreset}
            onMeasure={crop.measure}
            onBeginDrag={crop.beginDrag}
            onPointerMove={crop.handlePointerMove}
            onEndDrag={crop.endDrag}
            onResizeByKey={crop.resizeByKey}
            onBaseFileNameChange={setBaseFileName}
            onSave={handleSave}
            onSkip={handleSkip}
            onCancelAll={handleCancelAll}
            onRestart={handleRestart}
            onChangeImage={handleChangeImage}
          />
        ) : (
          <ImageDropZone
            onFilesSelected={handleFilesSelected}
            error={queueError}
          />
        )}
      </div>
    </div>
  )
}
