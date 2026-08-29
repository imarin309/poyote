import { encodeCanvas } from './encodeImage'

export async function captureFrameToBlob(
  video: HTMLVideoElement,
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

  return encodeCanvas(canvas, 'jpeg')
}
