import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'

interface ImageDropZoneProps {
  onFilesSelected: (files: File[]) => void
  error?: string | null
  // 編集画面ではすぐ上に「画像を追加」ボタンがあるため、compact は選択ボタンを持たない
  variant?: 'full' | 'compact'
  disabled?: boolean
}

export function ImageDropZone({
  onFilesSelected,
  error = null,
  variant = 'full',
  disabled = false,
}: ImageDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isCompact = variant === 'compact'

  // 無効中も preventDefault は外さない。外すとブラウザがファイルを開いて画面ごと離れてしまう
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    const files = Array.from(event.dataTransfer.files)
    if (!disabled && files.length > 0) {
      onFilesSelected(files)
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
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
    <div
      className={`flex flex-col items-center gap-4 ${isCompact ? 'w-full' : ''}`}
    >
      <div
        data-testid={isCompact ? 'image-append-drop-zone' : 'image-drop-zone'}
        aria-disabled={disabled}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex w-full flex-col items-center rounded-lg border-2 border-dashed text-center transition-colors ${
          isCompact ? 'gap-1 px-4 py-3 text-sm' : 'max-w-xl gap-3 p-10'
        } ${
          isDragOver
            ? 'border-blue-400 bg-blue-950/30'
            : 'border-neutral-600 bg-neutral-900'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        {isCompact ? (
          <p className="text-neutral-400">
            ここへドラッグ＆ドロップして追加（複数可）
          </p>
        ) : (
          <>
            <p className="text-neutral-300">
              画像ファイルをここへドラッグ＆ドロップ（複数可）
            </p>
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
              data-testid="image-file-input"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleInputChange}
            />
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
