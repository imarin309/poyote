export function stripExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex <= 0) {
    return filename
  }

  return filename.slice(0, lastDotIndex)
}

export function buildCaptureFilename(baseFileName: string): string {
  return `${baseFileName}.webp`
}
