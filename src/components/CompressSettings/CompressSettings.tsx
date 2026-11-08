import type {
  CompressionQuality,
  CompressionSettings,
} from '../../types/compression'

const QUALITY_OPTIONS: {
  value: CompressionQuality
  label: string
  hint: string
}[] = [
  { value: 'high', label: '高画質', hint: '細部を残す。サイズは大きめ' },
  {
    value: 'standard',
    label: '標準',
    hint: '作品ページに載せるならこれで十分',
  },
  { value: 'light', label: '軽量', hint: '画質より軽さを優先する' },
]

interface CompressSettingsProps {
  settings: CompressionSettings
  onSettingsChange: (settings: CompressionSettings) => void
  onConvert: () => void
  disabled: boolean
}

export function CompressSettings({
  settings,
  onSettingsChange,
  onConvert,
  disabled,
}: CompressSettingsProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <fieldset disabled={disabled} className="flex flex-col gap-2">
        <legend className="mb-2 text-sm text-neutral-400">画質</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {QUALITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-md border p-3 has-disabled:cursor-not-allowed has-disabled:opacity-50 ${
                settings.quality === option.value
                  ? 'border-blue-400 bg-blue-950/30'
                  : 'border-neutral-700 hover:border-neutral-500'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="radio"
                  name="compress-quality"
                  value={option.value}
                  checked={settings.quality === option.value}
                  onChange={() =>
                    onSettingsChange({ ...settings, quality: option.value })
                  }
                />
                {option.label}
              </span>
              <span className="text-xs text-neutral-400">{option.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm has-disabled:opacity-50">
        <input
          type="checkbox"
          checked={settings.removeAudio}
          disabled={disabled}
          onChange={(event) =>
            onSettingsChange({ ...settings, removeAudio: event.target.checked })
          }
        />
        音声を消す（ループ再生する作品動画向け）
      </label>

      <button
        type="button"
        onClick={onConvert}
        disabled={disabled}
        className="self-center rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        mp4に変換
      </button>
    </div>
  )
}
