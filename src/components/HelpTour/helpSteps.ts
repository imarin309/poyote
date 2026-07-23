export interface HelpStep {
  icon: string
  image?: string
  title: string
  description: string
  shortcuts?: { keys: string; label: string }[]
}

export const helpSteps: HelpStep[] = [
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
