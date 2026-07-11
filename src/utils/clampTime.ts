export function clampTime(time: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0
  }

  if (time < 0) {
    return 0
  }

  if (time > duration) {
    return duration
  }

  return time
}
