import { useCallback, useState } from 'react'
import { useImageFile } from '../hooks/useImageFile'
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
  const { reset: resetCrop, confirm: confirmCrop } = crop

  // 読み込んだらそのまま切り取り画面になる
  const handleFileSelected = useCallback(
    (file: File) => {
      if (loadFile(file)) {
        resetCrop()
      }
    },
    [loadFile, resetCrop],
  )

  const handleSave = useCallback(() => {
    void confirmCrop()
  }, [confirmCrop])

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-neutral-950 px-4 py-10 text-neutral-100">
      <Header route={route} onNavigate={onNavigate} onOpenHelp={onOpenHelp} />

      <div className="flex w-full flex-1 items-center justify-center">
        {image ? (
          <ImageEditor
            image={image}
            presetIndex={crop.presetIndex}
            crop={crop.crop}
            baseFileName={baseFileName}
            isSaving={isSaving}
            error={saveError}
            lastSaved={lastSaved}
            onSelectPreset={crop.selectPreset}
            onMeasure={crop.measure}
            onBeginDrag={crop.beginDrag}
            onPointerMove={crop.handlePointerMove}
            onEndDrag={crop.endDrag}
            onBaseFileNameChange={setBaseFileName}
            onSave={handleSave}
            onChangeImage={clear}
          />
        ) : (
          <ImageDropZone
            onFileSelected={handleFileSelected}
            error={imageError}
          />
        )}
      </div>
    </div>
  )
}
