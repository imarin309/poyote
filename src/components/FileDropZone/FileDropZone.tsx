import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void
  error: string | null
  accept: string
  message: string
  dropZoneTestId: string
  inputTestId: string
  multiple?: boolean
}

export function FileDropZone({
  onFilesSelected,
  error,
  accept,
  message,
  dropZoneTestId,
  inputTestId,
  multiple = false,
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    const files = Array.from(event.dataTransfer.files)
    if (files.length > 0) {
      onFilesSelected(multiple ? files : files.slice(0, 1))
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 0) {
      onFilesSelected(files)
    }
    event.target.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        data-testid={dropZoneTestId}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex w-full max-w-xl flex-col items-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-950/30'
            : 'border-neutral-600 bg-neutral-900'
        }`}
      >
        <p className="text-neutral-300">{message}</p>
        <p className="text-neutral-500">または</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
        >
          ファイルを選択
        </button>
        <input
          ref={inputRef}
          data-testid={inputTestId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
