const EXTENSIONS: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

export function stripExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex <= 0) {
    return filename
  }

  return filename.slice(0, lastDotIndex)
}

export function extensionForMimeType(mimeType: string): string {
  return EXTENSIONS[mimeType] ?? 'bin'
}

// 実際に生成できた形式から拡張子を決める。
// webp 非対応の環境では jpeg にフォールバックするため、指定形式では決められない
export function buildCaptureFilename(
  baseFileName: string,
  mimeType: string,
): string {
  return `${baseFileName}.${extensionForMimeType(mimeType)}`
}
