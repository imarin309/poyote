import {
  buildQualitySteps,
  INITIAL_QUALITY,
  MAX_OUTPUT_BYTES,
} from '../utils/imageQuality'

export type OutputFormat = 'webp' | 'jpeg'

const WEBP_MIME = 'image/webp'
const JPEG_MIME = 'image/jpeg'

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

// jpegは透過を持てないため、jpegで出す場合だけ白の下地に重ねる
function withWhiteBackdrop(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height

  const context = canvas.getContext('2d')
  if (!context) {
    return source
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(source, 0, 0)
  return canvas
}

async function encodeWithMime(
  canvas: HTMLCanvasElement,
  mimeType: string,
  maxBytes: number,
): Promise<Blob | null> {
  let smallest: Blob | null = null

  for (const quality of buildQualitySteps()) {
    const blob = await toBlob(canvas, mimeType, quality)

    // canvas.toBlobは非対応のtypeを指定してもnullではなく既定形式を黙って返すため、
    // blob.typeが要求どおりか確認してから採用する
    if (!blob || blob.type !== mimeType) {
      return null
    }

    smallest = blob
    if (blob.size <= maxBytes) {
      return blob
    }
  }

  // 下限品質でも上限を超える場合は、その時点でもっとも小さい結果を返す
  return smallest
}

// 動画フレームは常に不透明なので、下地を敷かずそのままエンコードする
async function encodeJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await toBlob(canvas, JPEG_MIME, INITIAL_QUALITY)
  if (!blob) {
    throw new Error('画像の生成に失敗しました。')
  }

  return blob
}

async function encodeWebpWithinSize(
  canvas: HTMLCanvasElement,
  maxBytes: number,
): Promise<Blob> {
  const webp = await encodeWithMime(canvas, WEBP_MIME, maxBytes)
  if (webp) {
    return webp
  }

  // webp非対応の環境ではjpegにフォールバックする
  const jpeg = await encodeWithMime(
    withWhiteBackdrop(canvas),
    JPEG_MIME,
    maxBytes,
  )
  if (jpeg) {
    return jpeg
  }

  throw new Error('画像の生成に失敗しました。')
}

export function encodeCanvas(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  maxBytes: number = MAX_OUTPUT_BYTES,
): Promise<Blob> {
  // 動画フレームは一部のモバイルブラウザでwebpのダウンロードに失敗するため、
  // 容量調整もかけずjpegで出す
  return format === 'jpeg'
    ? encodeJpeg(canvas)
    : encodeWebpWithinSize(canvas, maxBytes)
}
