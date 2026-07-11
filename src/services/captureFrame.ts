const DEFAULT_QUALITY = 0.85

export async function captureFrameToBlob(
  video: HTMLVideoElement,
  quality: number = DEFAULT_QUALITY,
): Promise<Blob> {
  if (video.readyState < video.HAVE_CURRENT_DATA) {
    throw new Error('動画フレームがまだ描画できる状態ではありません。')
  }

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvasコンテキストを取得できませんでした。')
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', quality)
  })

  if (!blob) {
    throw new Error('画像の生成に失敗しました。')
  }

  return blob
}
