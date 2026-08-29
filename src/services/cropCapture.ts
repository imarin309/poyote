import type { Size, SourceRect } from '../utils/cropRect'
import { encodeCanvas } from './encodeImage'
import type { OutputFormat } from './encodeImage'

export type CropSource = HTMLVideoElement | HTMLImageElement

export async function cropToBlob(
  source: CropSource,
  sourceRect: SourceRect,
  targetSize: Size,
  format: OutputFormat,
): Promise<Blob> {
  if (
    source instanceof HTMLVideoElement &&
    source.readyState < source.HAVE_CURRENT_DATA
  ) {
    throw new Error('動画フレームがまだ描画できる状態ではありません。')
  }

  if (source instanceof HTMLImageElement && !source.complete) {
    throw new Error('画像がまだ読み込まれていません。')
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

  return encodeCanvas(canvas, format)
}
