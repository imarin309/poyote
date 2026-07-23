import { useEffect, useState } from 'react'
import { helpSteps } from './helpSteps'

interface HelpTourProps {
  onClose: () => void
}

export function HelpTour({ onClose }: HelpTourProps) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowRight') {
        setStepIndex((index) => Math.min(index + 1, helpSteps.length - 1))
      } else if (event.key === 'ArrowLeft') {
        setStepIndex((index) => Math.max(index - 1, 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const step = helpSteps[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === helpSteps.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-tour-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl"
      >
        <div className="relative flex h-36 items-center justify-center border-b border-neutral-800 bg-neutral-800/60 p-3">
          <span className="absolute top-3 left-4 text-xs tabular-nums text-neutral-500">
            {stepIndex + 1} / {helpSteps.length}
          </span>
          {step.image ? (
            <img
              src={step.image}
              alt=""
              className="max-h-full max-w-full rounded-md object-contain"
            />
          ) : (
            <span className="text-4xl">{step.icon}</span>
          )}
        </div>

        <div className="px-5 pt-5 pb-2">
          <h2
            id="help-tour-title"
            className="mb-2 text-lg font-semibold text-balance"
          >
            {step.title}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-400">
            {step.description}
          </p>

          {step.shortcuts && (
            <div className="mt-3 flex flex-col gap-1.5">
              {step.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center gap-2 text-[13px] text-neutral-400"
                >
                  <span className="rounded border border-neutral-600 bg-neutral-800 px-1.5 py-0.5 font-mono text-xs text-neutral-100">
                    {shortcut.keys}
                  </span>
                  <span>{shortcut.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-neutral-400 hover:text-neutral-100"
          >
            スキップ
          </button>

          <div className="flex gap-1.5">
            {helpSteps.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === stepIndex
                    ? 'w-4 bg-blue-500'
                    : 'w-1.5 bg-neutral-600'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
              disabled={isFirstStep}
              className="rounded-md border border-neutral-600 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-35"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={() =>
                isLastStep ? onClose() : setStepIndex((index) => index + 1)
              }
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
            >
              {isLastStep ? 'はじめる' : '次へ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
