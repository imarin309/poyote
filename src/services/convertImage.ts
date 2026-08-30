import { encodeCanvasWithinSize } from './encodeImage'
import { loadImageElement } from './loadImageElement'

// 縦横比もピクセル数も変えず、容量だけを上限内に収める
export async function convertImageToBlob(objectUrl: string): Promise<Blob> {
  const image = await loadImageElement(objectUrl)

  // onloadが発火しても壊れた画像はサイズが0で届くことがある
  if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    throw new Error('画像のサイズを取得できませんでした。')
  }

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvasコンテキストを取得できませんでした。')
  }

  context.drawImage(image, 0, 0)

  return encodeCanvasWithinSize(canvas)
}
