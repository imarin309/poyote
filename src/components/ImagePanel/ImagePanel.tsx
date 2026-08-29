import type { LoadedImage } from '../../types/image'
import type { SavedImage } from '../../hooks/useImageSave'

interface ImagePanelProps {
  image: LoadedImage
  baseFileName: string
  onBaseFileNameChange: (value: string) => void
  onCrop: () => void
  onChangeImage: () => void
  isSaving: boolean
  error: string | null
  lastSaved: SavedImage | null
}

export function ImagePanel({
  image,
  baseFileName,
  onBaseFileNameChange,
  onCrop,
  onChangeImage,
  isSaving,
  error,
  lastSaved,
}: ImagePanelProps) {
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <img
        src={image.objectUrl}
        alt={image.file.name}
        className="max-h-[40vh] max-w-full rounded-md border border-neutral-800"
      />
      <p className="text-xs text-neutral-500">{image.file.name}</p>

      <div className="flex w-full items-center gap-2">
        <label
          htmlFor="image-base-file-name"
          className="shrink-0 text-sm text-neutral-400"
        >
          ファイル名
        </label>
        <input
          id="image-base-file-name"
          type="text"
          value={baseFileName}
          onChange={(event) => onBaseFileNameChange(event.target.value)}
          className="w-full rounded-md border border-neutral-600 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          data-testid="image-crop-button"
          onClick={onCrop}
          disabled={isSaving}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          トリミングして保存
        </button>
        <button
          type="button"
          data-testid="change-image-button"
          onClick={onChangeImage}
          disabled={isSaving}
          className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          画像を変更
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {lastSaved && (
        <div className="flex items-center gap-3 rounded-md border border-neutral-700 p-2">
          <img
            src={lastSaved.objectUrl}
            alt="直前に保存した画像"
            className="h-16 w-auto rounded"
          />
          <p className="text-xs text-neutral-400">{lastSaved.filename}</p>
        </div>
      )}
    </div>
  )
}
