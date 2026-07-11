interface LastCapture {
  objectUrl: string
  filename: string
  timeSeconds: number
}

interface CapturePreviewProps {
  baseFileName: string
  onBaseFileNameChange: (value: string) => void
  onCapture: () => void
  isSaving: boolean
  disabled?: boolean
  error: string | null
  lastCapture: LastCapture | null
}

export function CapturePreview({
  baseFileName,
  onBaseFileNameChange,
  onCapture,
  isSaving,
  disabled = false,
  error,
  lastCapture,
}: CapturePreviewProps) {
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-3">
      <div className="flex w-full items-center gap-2">
        <label htmlFor="base-file-name" className="shrink-0 text-sm text-neutral-400">
          ベースファイル名
        </label>
        <input
          id="base-file-name"
          type="text"
          value={baseFileName}
          onChange={(event) => onBaseFileNameChange(event.target.value)}
          className="w-full rounded-md border border-neutral-600 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100"
        />
      </div>

      <button
        type="button"
        data-testid="capture-button"
        onClick={onCapture}
        disabled={isSaving || disabled}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? '保存中…' : '現在のフレームを保存（S）'}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {lastCapture && (
        <div className="flex items-center gap-3 rounded-md border border-neutral-700 p-2">
          <img
            src={lastCapture.objectUrl}
            alt="直前に保存したフレーム"
            className="h-16 w-auto rounded"
          />
          <p className="text-xs text-neutral-400">{lastCapture.filename}</p>
        </div>
      )}
    </div>
  )
}
