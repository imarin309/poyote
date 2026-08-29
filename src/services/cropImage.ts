import type { Size, SourceRect } from '../utils/cropRect'

const JPEG_MIME = 'image/jpeg'
const JPEG_QUALITY = 0.85

export async function cropImageToBlob(
  source: HTMLImageElement,
  sourceRect: SourceRect,
  targetSize: Size,
): Promise<Blob> {
  if (!source.complete) {
    throw new Error('画像がまだ読み込まれていません。')
  }

  // completeは読み込みに失敗した場合もtrueになるため、実サイズで届いたか確かめる
  if (source.naturalWidth <= 0 || source.naturalHeight <= 0) {
    throw new Error('画像を読み込めませんでした。')
  }

  if (sourceRect.width <= 0 || sourceRect.height <= 0) {
    throw new Error('切り取り範囲が不正です。')
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetSize.width
  canvas.height = targetSize.height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvasコンテキストを取得できませんでした。')
  }

  // jpegは透過を持てないため、透過部分が黒く出ないよう白の下地を敷く
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(
    source,
    sourceRect.left,
    sourceRect.top,
    sourceRect.width,
    sourceRect.height,
    0,
    0,
    targetSize.width,
    targetSize.height,
  )

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, JPEG_MIME, JPEG_QUALITY),
  )

  if (!blob) {
    throw new Error('画像の生成に失敗しました。')
  }

  return blob
}
