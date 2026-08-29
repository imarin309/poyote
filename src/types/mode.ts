export type AppMode = 'video' | 'image'

export const MODE_LABELS: Record<AppMode, string> = {
  video: '動画から切り抜く',
  image: '画像をリサイズ',
}

export const MODE_DESCRIPTIONS: Record<AppMode, string> = {
  video: '動画から好きなフレームを切り抜いて画像保存するツール',
  image: '手元の画像を好きな比率に切り取ってリサイズするツール',
}
