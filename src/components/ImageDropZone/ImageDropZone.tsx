import { FileDropZone } from '../FileDropZone/FileDropZone'

interface ImageDropZoneProps {
  onFilesSelected: (files: File[]) => void
  error: string | null
}

export function ImageDropZone({ onFilesSelected, error }: ImageDropZoneProps) {
  return (
    <FileDropZone
      onFilesSelected={onFilesSelected}
      error={error}
      accept="image/*"
      message="画像ファイルをここへドラッグ＆ドロップ（複数可）"
      dropZoneTestId="image-drop-zone"
      inputTestId="image-file-input"
      multiple
    />
  )
}
