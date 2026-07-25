const THUMBNAIL_WIDTH = 160
const THUMBNAIL_QUALITY = 0.7
const THUMBNAIL_MIME_TYPES = ['image/webp', 'image/jpeg'] as const

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

async function encodeCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  for (const type of THUMBNAIL_MIME_TYPES) {
    const blob = await canvasToBlob(canvas, type, THUMBNAIL_QUALITY)
    if (blob) {
      return blob
    }
  }

  throw new Error('サムネイルの生成に失敗しました。')
}

export async function captureThumbnailBlob(
  video: HTMLVideoElement,
): Promise<Blob> {
  if (video.readyState < video.HAVE_CURRENT_DATA) {
    throw new Error('サムネイルを生成できる状態ではありません。')
  }

  if (video.videoWidth <= 0 || video.videoHeight <= 0) {
    throw new Error('動画のサイズを取得できませんでした。')
  }

  const aspectRatio = video.videoHeight / video.videoWidth
  const width = Math.min(THUMBNAIL_WIDTH, video.videoWidth)
  const height = Math.round(width * aspectRatio)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvasコンテキストを取得できませんでした。')
  }

  context.drawImage(video, 0, 0, width, height)

  return encodeCanvas(canvas)
}
