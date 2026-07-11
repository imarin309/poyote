import { useEffect } from 'react'
import { isEditableTarget } from '../utils/isEditableTarget'
import { resolveSeekAmount } from '../utils/resolveSeekAmount'

interface UseKeyboardShortcutsOptions {
  enabled: boolean
  onSeek: (deltaSeconds: number) => void
  onTogglePlayPause: () => void
  onCapture: () => void
}

export function useKeyboardShortcuts({
  enabled,
  onSeek,
  onTogglePlayPause,
  onCapture,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return
      }

      if (event.code === 'Space') {
        event.preventDefault()
        onTogglePlayPause()
        return
      }

      if (event.key === 's' || event.key === 'S') {
        event.preventDefault()
        onCapture()
        return
      }

      const seekAmount = resolveSeekAmount(event.key, {
        shift: event.shiftKey,
        alt: event.altKey,
      })

      if (seekAmount !== null) {
        event.preventDefault()
        onSeek(seekAmount)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onSeek, onTogglePlayPause, onCapture])
}
