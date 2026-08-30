import { MAX_OUTPUT_BYTES } from '../../utils/imageQuality'

export interface HelpStep {
  icon: string
  image?: string
  title: string
  description: string
  shortcuts?: { keys: string; label: string }[]
}

export const videoHelpSteps: HelpStep[] = [
  {
    icon: '🎬',
    image: '/help/step-drop-zone.png',
    title: '動画を読み込む',
    description:
      '画面に動画ファイルをドラッグ&ドロップするか、クリックして選択すると読み込まれます。',
  },
  {
    icon: '🖼️',
    image: '/help/step-thumbnail-grid.png',
    title: 'サムネイルでシーンを探す',
    description:
      '読み込むと自動でシーンのサムネイルが並びます。気になるコマをクリックすると、その時刻にジャンプできます。',
  },
  {
    icon: '⏯️',
    image: '/help/step-playback-controls.png',
    title: '再生位置を微調整する',
    description:
      '再生・一時停止のほか、±0.1秒/1秒/10秒単位のコマ送りボタンで、狙った瞬間にぴったり合わせられます。',
  },
  {
    icon: '📸',
    image: '/help/step-capture-preview.png',
    title: '好きな瞬間をキャプチャ',
    description:
      'ファイル名を指定して「キャプチャ」を押すと、今表示中のコマが画像として保存されます。',
  },
  {
    icon: '⌨️',
    title: 'キーボードでも操作できる',
    description: 'マウスを使わなくても、キーひとつで操作できます。',
    shortcuts: [
      { keys: 'Space', label: '再生 / 一時停止' },
      { keys: '← / →', label: '1秒送り戻し' },
      { keys: 'Shift + ← / →', label: '0.1秒送り戻し' },
      { keys: 'Alt + ← / →', label: '10秒送り戻し' },
      { keys: 'S', label: 'キャプチャ' },
    ],
  },
]

const MAX_OUTPUT_KILOBYTES = Math.round(MAX_OUTPUT_BYTES / 1024)

export const imageHelpSteps: HelpStep[] = [
  {
    icon: '🖼️',
    title: '画像を読み込む',
    description:
      '画面に画像ファイルをドラッグ&ドロップするか、クリックして選択すると読み込まれます。複数枚まとめて選んでも構いません。読み込むと、そのまま切り取り画面になります。',
  },
  {
    icon: '✂️',
    title: '比率を選んで切り取る',
    description:
      '横長2種・縦長2種のプリセットから比率を選び、枠をドラッグで移動、四隅で拡大縮小します。「この範囲で保存」を押しても画面は切り替わらないので、比率を変えて続けて保存できます。',
  },
  {
    icon: '📚',
    title: '複数枚を順番に処理する',
    description:
      '複数枚を読み込むと「N / M 件」の進捗が出ます。保存すると次の画像に進み、「この画像はスキップ」で飛ばせます。「全てキャンセル」は切り取りだけをやめる操作で、読み込んだ画像はそのまま残ります。',
  },
  {
    icon: '⚡',
    title: '比率を変えずに容量だけ落とす',
    description: `切り取りが要らないときは「比率そのままで一括変換」を使います。縦横比もピクセル数も変えず、${MAX_OUTPUT_KILOBYTES}KB以下を目指して全件を変換します。保存はZIP1つにまとめて行うので、展開して取り出してください。`,
  },
  {
    icon: '💾',
    title: '出力について',
    description: `保存する画像はwebp形式で、${MAX_OUTPUT_KILOBYTES}KB以下に収まるよう画質を自動調整します。ファイル名は元の名前を引き継ぎ、保存前に書き換えられます。`,
  },
]
