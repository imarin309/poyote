export type Route = 'video' | 'image'

export const ROUTES: Route[] = ['video', 'image']

export const ROUTE_PATHS: Record<Route, string> = {
  video: '/',
  image: '/image',
}

export const ROUTE_LABELS: Record<Route, string> = {
  video: '動画から切り抜く',
  image: '画像をリサイズ',
}

export const ROUTE_DESCRIPTIONS: Record<Route, string> = {
  video: '動画から好きなフレームを切り抜いて画像保存するツール',
  image: '手元の画像を好きな比率に切り取ってリサイズするツール',
}
