export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00'
  }

  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  const mm = minutes.toString().padStart(2, '0')
  const ss = secs.toString().padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`
  }

  return `${mm}:${ss}`
}

export function formatTimeForFilename(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0
  const totalMs = Math.round(safeSeconds * 1000)

  const minutes = Math.floor(totalMs / 60000)
  const secs = Math.floor((totalMs % 60000) / 1000)
  const ms = totalMs % 1000

  const mm = minutes.toString().padStart(2, '0')
  const ss = secs.toString().padStart(2, '0')
  const mmm = ms.toString().padStart(3, '0')

  return `${mm}-${ss}-${mmm}`
}
