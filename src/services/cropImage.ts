import type { Size, SourceRect } from '../utils/cropRect'
import { encodeCanvasWithinSize } from './encodeImage'

// 回転していない画像は <img>、回転した画像は回して描いた <canvas> がプレビューになる
export type PreviewSource = HTMLImageElement | HTMLCanvasElement

function getSourceSize(source: PreviewSource): Size {
  return source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height }
}

export async function cropImageToBlob(
  source: PreviewSource,
  sourceRect: SourceRect,
  targetSize: Size,
): Promise<Blob> {
  if (source instanceof HTMLImageElement && !source.complete) {
    throw new Error('画像がまだ読み込まれていません。')
  }

  // completeは読み込みに失敗した場合もtrueになるため、実サイズで届いたか確かめる
  const sourceSize = getSourceSize(source)
  if (sourceSize.width <= 0 || sourceSize.height <= 0) {
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

  // 白の下地はjpegにフォールバックしたときだけ敷く（encodeCanvasWithinSize側）。
  // webpは透過を持てるのでここでは塗らない
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

  return encodeCanvasWithinSize(canvas)
}
