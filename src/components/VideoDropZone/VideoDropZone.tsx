import { FileDropZone } from '../FileDropZone/FileDropZone'

interface VideoDropZoneProps {
  onFileSelected: (file: File) => void
  error: string | null
}

export function VideoDropZone({ onFileSelected, error }: VideoDropZoneProps) {
  return (
    <FileDropZone
      onFilesSelected={(files) => onFileSelected(files[0])}
      error={error}
      accept="video/*"
      message="動画ファイルをここへドラッグ＆ドロップ"
      dropZoneTestId="video-drop-zone"
      inputTestId="video-file-input"
    />
  )
}
