const THUMBNAIL_WIDTH = 160
const THUMBNAIL_QUALITY = 0.7

export async function captureThumbnailBlob(
  video: HTMLVideoElement,
): Promise<Blob> {
  if (video.readyState < video.HAVE_CURRENT_DATA) {
    throw new Error('サムネイルを生成できる状態ではありません。')
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

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', THUMBNAIL_QUALITY)
  })

  if (!blob) {
    throw new Error('サムネイルの生成に失敗しました。')
  }

  return blob
}
