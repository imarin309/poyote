import { useCallback, useState } from 'react'
import { useImageFile } from '../hooks/useImageFile'
import { useImageSave } from '../hooks/useImageSave'
import { useImageCrop } from '../hooks/useImageCrop'
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
  const { image, error: imageError, loadFile, clear } = useImageFile()

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
  const { open: openCrop, close: closeCrop, confirm: confirmCrop } = crop

  const handleCropConfirm = useCallback(async () => {
    if (await confirmCrop()) {
      closeCrop()
    }
  }, [confirmCrop, closeCrop])

  const handleChangeImage = useCallback(() => {
    closeCrop()
    clear()
  }, [closeCrop, clear])

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-neutral-950 px-4 py-10 text-neutral-100">
      <Header route={route} onNavigate={onNavigate} onOpenHelp={onOpenHelp} />

      <div className="flex flex-1 items-center justify-center">
        {image ? (
          <ImagePanel
            image={image}
            baseFileName={baseFileName}
            onBaseFileNameChange={setBaseFileName}
            onCrop={() => openCrop(image.objectUrl)}
            onChangeImage={handleChangeImage}
            isSaving={isSaving}
            error={saveError}
            lastSaved={lastSaved}
          />
        ) : (
          <ImageDropZone onFileSelected={loadFile} error={imageError} />
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
          onConfirm={handleCropConfirm}
          onClose={closeCrop}
        />
      )}
    </div>
  )
}
