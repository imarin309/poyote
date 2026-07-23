import { formatDuration } from '../../utils/formatTime'

interface PlaybackControlsProps {
  currentTime: number
  duration: number
  isPaused: boolean
  disabled?: boolean
  onSeek: (deltaSeconds: number) => void
  onTogglePlayPause: () => void
}

const BACKWARD_STEPS = [
  { label: '-10秒', delta: -10 },
  { label: '-1秒', delta: -1 },
  { label: '-0.1秒', delta: -0.1 },
]

const FORWARD_STEPS = [
  { label: '+0.1秒', delta: 0.1 },
  { label: '+1秒', delta: 1 },
  { label: '+10秒', delta: 10 },
]

export function PlaybackControls({
  currentTime,
  duration,
  isPaused,
  disabled = false,
  onSeek,
  onTogglePlayPause,
}: PlaybackControlsProps) {
  return (
    <div
      data-testid="playback-controls"
      className="flex w-full max-w-3xl flex-col items-center gap-3"
    >
      <p data-testid="time-display" className="text-sm text-neutral-400">
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {BACKWARD_STEPS.map((step) => (
          <button
            key={step.label}
            type="button"
            onClick={() => onSeek(step.delta)}
            disabled={disabled}
            className="rounded-md border border-neutral-600 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step.label}
          </button>
        ))}
        <button
          type="button"
          data-testid="play-pause-button"
          onClick={onTogglePlayPause}
          disabled={disabled}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPaused ? '再生' : '一時停止'}
        </button>
        {FORWARD_STEPS.map((step) => (
          <button
            key={step.label}
            type="button"
            onClick={() => onSeek(step.delta)}
            disabled={disabled}
            className="rounded-md border border-neutral-600 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step.label}
          </button>
        ))}
      </div>
    </div>
  )
}
