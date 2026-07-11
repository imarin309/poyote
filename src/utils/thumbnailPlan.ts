export const DEFAULT_THUMBNAIL_INTERVAL_SECONDS = 10
export const MAX_THUMBNAIL_COUNT = 360

export function resolveThumbnailInterval(
  duration: number,
  baseInterval: number = DEFAULT_THUMBNAIL_INTERVAL_SECONDS,
  maxCount: number = MAX_THUMBNAIL_COUNT,
): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return baseInterval
  }

  const rawCount = Math.floor(duration / baseInterval) + 1
  if (rawCount <= maxCount) {
    return baseInterval
  }

  return duration / (maxCount - 1)
}

export function buildThumbnailTimes(duration: number, interval: number): number[] {
  if (!Number.isFinite(duration) || duration <= 0 || interval <= 0) {
    return [0]
  }

  const count = Math.floor(duration / interval) + 1
  return Array.from({ length: count }, (_, index) => index * interval)
}
