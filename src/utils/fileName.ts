// オブジェクトだと 'toString' などプロトタイプ由来のキーを引いてしまうためMapを使う
const EXTENSIONS = new Map([
  ['image/webp', 'webp'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
])

export function stripExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex <= 0) {
    return filename
  }

  return filename.slice(0, lastDotIndex)
}

export function extensionForMimeType(mimeType: string): string {
  return EXTENSIONS.get(mimeType) ?? 'bin'
}

// 動画側は一部のモバイルブラウザでwebpのダウンロードに失敗した実績があるため、jpg固定のまま
export function buildCaptureFilename(baseFileName: string): string {
  return `${baseFileName}.jpg`
}

// 画像側は「実際に生成できた形式」から拡張子を決める。
// webp非対応の環境ではjpegにフォールバックするため、指定形式では決められない
export function buildImageFilename(
  baseFileName: string,
  mimeType: string,
): string {
  return `${baseFileName}.${extensionForMimeType(mimeType)}`
}

// 一括変換は1回のダウンロードにまとめるため、実行のたびに区別できるよう日時を入れる
export function buildZipFilename(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('')

  return `images-${stamp}.zip`
}
