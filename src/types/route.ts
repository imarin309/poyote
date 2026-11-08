export type Route = 'top' | 'video' | 'image' | 'compress'

export const ROUTES: Route[] = ['top', 'video', 'image', 'compress']

// ヘッダーのタブに並べる機能ページ。トップへは見出しのリンクから戻る
export const FEATURE_ROUTES: Route[] = ['video', 'image', 'compress']

// URLは /movie だが、コードベースが video で統一されているのでルートIDは video のまま
export const ROUTE_PATHS: Record<Route, string> = {
  top: '/',
  video: '/movie',
  image: '/image',
  compress: '/compress',
}

export const ROUTE_LABELS: Record<Route, string> = {
  top: 'トップ',
  video: '動画から切り抜く',
  image: '画像をリサイズ',
  compress: '動画を圧縮',
}

export const ROUTE_DESCRIPTIONS: Record<Route, string> = {
  top: '動画や画像から公開用の画像を作るツール',
  video: '動画から好きなフレームを切り抜いて画像保存するツール',
  image: '手元の画像を好きな比率に切り取ってリサイズするツール',
  compress: '手元の動画をWeb公開用の軽いmp4に変換するツール',
}
