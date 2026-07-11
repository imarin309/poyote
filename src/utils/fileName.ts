import { formatTimeForFilename } from './formatTime'

export function stripExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex <= 0) {
    return filename
  }

  return filename.slice(0, lastDotIndex)
}

export function buildCaptureFilename(
  baseFileName: string,
  currentTimeSeconds: number,
): string {
  return `${baseFileName}-${formatTimeForFilename(currentTimeSeconds)}.webp`
}
