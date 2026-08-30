// 一括変換は表示中の <img> を持たないため、URLから読み込み直す
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('画像を読み込めませんでした。'))
    image.src = src
  })
}
