import { rotatedSize } from '../utils/rotation'
import type { Rotation } from '../utils/rotation'

// 回した結果はエンコードせず、このcanvasをそのままプレビューと切り取り元に使う。
// 大きな画像ではPNGへのエンコードと再デコードが重く、回転のたびに待たされるため
export function drawRotated(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  rotation: Rotation,
): void {
  const outputSize = rotatedSize(
    { width: image.naturalWidth, height: image.naturalHeight },
    rotation,
  )
  canvas.width = outputSize.width
  canvas.height = outputSize.height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvasコンテキストを取得できませんでした。')
  }

  context.translate(outputSize.width / 2, outputSize.height / 2)
  context.rotate((rotation * Math.PI) / 180)
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)
}
