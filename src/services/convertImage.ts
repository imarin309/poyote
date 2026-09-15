import { fitLongSide } from '../utils/aspectPresets'
import { encodeCanvasWithinSize } from './encodeImage'
import { loadImageElement } from './loadImageElement'

// 縦横比は変えず、長辺を揃えたうえで容量を上限内に収める
export async function convertImageToBlob(objectUrl: string): Promise<Blob> {
  const image = await loadImageElement(objectUrl)

  // onloadが発火しても壊れた画像はサイズが0で届くことがある
  if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    throw new Error('画像のサイズを取得できませんでした。')
  }

  const outputSize = fitLongSide({
    width: image.naturalWidth,
    height: image.naturalHeight,
  })

  const canvas = document.createElement('canvas')
  canvas.width = outputSize.width
  canvas.height = outputSize.height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvasコンテキストを取得できませんでした。')
  }

  context.drawImage(image, 0, 0, outputSize.width, outputSize.height)

  return encodeCanvasWithinSize(canvas)
}
