import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ImageEditor } from './ImageEditor'
import { ASPECT_PRESETS } from '../../utils/aspectPresets'
import type { LoadedImage } from '../../types/image'

const image: LoadedImage = {
  file: new File([''], 'photo.png', { type: 'image/png' }),
  objectUrl: 'blob:image',
}

const crop = { x: 100, y: 50, width: 400, height: 225 }

type Props = Parameters<typeof ImageEditor>[0]

function renderEditor(overrides: Partial<Props> = {}) {
  const props: Props = {
    image,
    index: 0,
    total: 1,
    savedCount: 0,
    skippedCount: 0,
    isFinished: false,
    presetIndex: 0,
    crop,
    baseFileName: 'photo',
    isSaving: false,
    isConverting: false,
    convertProgress: { current: 0, total: 0 },
    convertResults: [],
    convertZipFilename: null,
    convertError: null,
    error: null,
    notice: null,
    lastSaved: null,
    onSelectPreset: vi.fn(),
    onMeasure: vi.fn(),
    onBeginDrag: vi.fn(),
    onPointerMove: vi.fn(),
    onEndDrag: vi.fn(),
    onResizeByKey: vi.fn(),
    onBaseFileNameChange: vi.fn(),
    onSave: vi.fn(),
    onSkip: vi.fn(),
    onCancelAll: vi.fn(),
    onRestart: vi.fn(),
    onChangeImage: vi.fn(),
    onBatchConvert: vi.fn(),
    ...overrides,
  }

  render(<ImageEditor {...props} />)
  return props
}

describe('ImageEditor', () => {
  it('オーバーレイではなくページ内に直接表示する', () => {
    renderEditor()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('選択中プリセットの出力サイズを表示する', () => {
    renderEditor({ presetIndex: 1 })
    const preset = ASPECT_PRESETS[1]
    expect(
      screen.getByText(new RegExp(`${preset.width}×${preset.height}px`)),
    ).toBeInTheDocument()
  })

  it('プリセットボタンでonSelectPresetが呼ばれる', () => {
    const props = renderEditor()
    fireEvent.click(
      screen.getByRole('button', { name: ASPECT_PRESETS[2].label }),
    )
    expect(props.onSelectPreset).toHaveBeenCalledWith(2)
  })

  it('切り取り範囲をcropの座標どおりに配置する', () => {
    renderEditor()
    expect(screen.getByTestId('crop-area')).toHaveStyle({
      left: '100px',
      top: '50px',
      width: '400px',
      height: '225px',
    })
  })

  it('四隅のハンドルを切り取り範囲の角に配置する', () => {
    renderEditor()
    expect(screen.getByTestId('crop-handle-nw')).toHaveStyle({
      left: '100px',
      top: '50px',
    })
    expect(screen.getByTestId('crop-handle-se')).toHaveStyle({
      left: '500px',
      top: '275px',
    })
  })

  it('ハンドルのpointerdownでリサイズ方向を伝える', () => {
    const props = renderEditor()
    fireEvent.pointerDown(screen.getByTestId('crop-handle-ne'))
    expect(props.onBeginDrag).toHaveBeenCalledWith('ne', expect.anything())
  })

  it('ハンドルは名前を持つボタンにする', () => {
    renderEditor()
    const handle = screen.getByTestId('crop-handle-se')
    expect(handle.tagName).toBe('BUTTON')
    expect(handle).toHaveAttribute('type', 'button')
    expect(handle).toHaveAccessibleName('切り取り範囲の右下をリサイズ')
  })

  it('ハンドルは矢印キーでもリサイズできる', () => {
    const props = renderEditor()
    fireEvent.keyDown(screen.getByTestId('crop-handle-se'), {
      key: 'ArrowDown',
    })
    expect(props.onResizeByKey).toHaveBeenCalledWith('se', expect.anything())
  })

  it('暗転が周囲へ広がらないよう画像のコンテナで切る', () => {
    renderEditor()
    const area = screen.getByTestId('crop-area')
    expect(area.parentElement).toHaveClass('overflow-hidden')
    // ハンドルは半分はみ出すので、切り取られるコンテナの外に置く
    expect(screen.getByTestId('crop-handle-nw').parentElement).not.toBe(
      area.parentElement,
    )
  })

  it('保存ボタンでonSaveが呼ばれる', () => {
    const props = renderEditor()
    fireEvent.click(screen.getByTestId('crop-save-button'))
    expect(props.onSave).toHaveBeenCalled()
  })

  it('切り取り範囲が未確定の間は保存できない', () => {
    renderEditor({ crop: null })
    expect(screen.getByTestId('crop-save-button')).toBeDisabled()
  })

  it('保存中は操作ボタンを無効にする', () => {
    renderEditor({ isSaving: true })
    expect(screen.getByTestId('crop-save-button')).toBeDisabled()
    expect(screen.getByTestId('change-image-button')).toBeDisabled()
  })

  it('ファイル名の編集でonBaseFileNameChangeが呼ばれる', () => {
    const props = renderEditor()
    fireEvent.change(screen.getByLabelText('ファイル名'), {
      target: { value: 'cover' },
    })
    expect(props.onBaseFileNameChange).toHaveBeenCalledWith('cover')
  })

  it('画像を変更ボタンでonChangeImageが呼ばれる', () => {
    const props = renderEditor()
    fireEvent.click(screen.getByTestId('change-image-button'))
    expect(props.onChangeImage).toHaveBeenCalled()
  })

  it('保存後も切り取りUIは残したまま保存結果を出す', () => {
    renderEditor({
      lastSaved: { objectUrl: 'blob:saved', filename: 'photo.jpg' },
    })
    expect(screen.getByText('保存しました: photo.jpg')).toBeInTheDocument()
    expect(screen.getByTestId('crop-area')).toBeInTheDocument()
  })

  it('エラーがある場合メッセージを表示する', () => {
    renderEditor({ error: '画像の保存に失敗しました。' })
    expect(screen.getByRole('alert')).toHaveTextContent(
      '画像の保存に失敗しました。',
    )
  })

  // 読み込み成功と同時にドロップゾーンは消えるので、警告はここで見せる
  it('除外ファイルの警告を表示する', () => {
    renderEditor({ notice: '画像でないファイル1件を除外しました。' })
    expect(screen.getByTestId('image-notice')).toHaveTextContent(
      '画像でないファイル1件を除外しました。',
    )
  })
})

describe('ImageEditor の複数枚処理', () => {
  it('複数枚のときは進捗を表示する', () => {
    renderEditor({ index: 1, total: 3 })
    expect(screen.getByTestId('queue-progress')).toHaveTextContent('2 / 3 件')
  })

  it('1枚だけのときは進捗もスキップも全てキャンセルも出さない', () => {
    renderEditor({ total: 1 })
    expect(screen.queryByTestId('queue-progress')).not.toBeInTheDocument()
    expect(screen.queryByTestId('skip-image-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cancel-queue-button')).not.toBeInTheDocument()
  })

  it('スキップボタンでonSkipが呼ばれる', () => {
    const props = renderEditor({ total: 2 })
    fireEvent.click(screen.getByTestId('skip-image-button'))
    expect(props.onSkip).toHaveBeenCalled()
  })

  it('全てキャンセルでonCancelAllが呼ばれる', () => {
    const props = renderEditor({ total: 2 })
    fireEvent.click(screen.getByTestId('cancel-queue-button'))
    expect(props.onCancelAll).toHaveBeenCalled()
  })

  it('完了したら切り取りUIを閉じてサマリを出す', () => {
    renderEditor({
      image: null,
      isFinished: true,
      index: 3,
      total: 3,
      savedCount: 2,
      skippedCount: 1,
    })

    expect(screen.queryByTestId('crop-area')).not.toBeInTheDocument()
    expect(screen.getByTestId('queue-summary')).toHaveTextContent(
      '3 件中 2 件を保存、1 件スキップ',
    )
  })

  it('全てキャンセルしたあとは未処理の件数もサマリに出す', () => {
    renderEditor({
      image: null,
      isFinished: true,
      index: 3,
      total: 3,
      savedCount: 1,
      skippedCount: 0,
    })

    expect(screen.getByTestId('queue-summary')).toHaveTextContent(
      '3 件中 1 件を保存、0 件スキップ、2 件は未処理',
    )
  })

  it('サマリから最初からやり直せる', () => {
    const props = renderEditor({ image: null, isFinished: true, total: 2 })
    fireEvent.click(screen.getByTestId('restart-queue-button'))
    expect(props.onRestart).toHaveBeenCalled()
  })

  it('サマリから別の画像を選び直せる', () => {
    const props = renderEditor({ image: null, isFinished: true, total: 2 })
    fireEvent.click(screen.getByTestId('change-image-button'))
    expect(props.onChangeImage).toHaveBeenCalled()
  })
})

describe('ImageEditor の一括変換', () => {
  it('切り取りと並べて一括変換の入口を出す', () => {
    renderEditor({ total: 3 })
    expect(screen.getByTestId('batch-convert')).toHaveTextContent(
      '比率そのままで一括変換',
    )
    expect(screen.getByTestId('batch-convert-button')).toHaveTextContent(
      '全 3 件を変換して保存',
    )
  })

  // 「全てキャンセル」で残した画像は一括変換に使えるようにする
  it('切り取りを終えたあとも一括変換できる', () => {
    const props = renderEditor({ image: null, isFinished: true, total: 2 })
    fireEvent.click(screen.getByTestId('batch-convert-button'))
    expect(props.onBatchConvert).toHaveBeenCalled()
  })

  it('変換中は進捗を出して切り取り操作を止める', () => {
    renderEditor({
      total: 3,
      isConverting: true,
      convertProgress: { current: 1, total: 3 },
    })

    expect(screen.getByTestId('batch-convert-button')).toHaveTextContent(
      '変換中… 1 / 3 件',
    )
    expect(screen.getByTestId('batch-convert-button')).toBeDisabled()
    expect(screen.getByTestId('crop-save-button')).toBeDisabled()
  })

  it('変換結果をファイル名と容量の一覧で出す', () => {
    renderEditor({
      convertResults: [
        { filename: 'a.webp', bytes: 102400, withinLimit: true, error: null },
      ],
    })

    const list = screen.getByTestId('convert-results')
    expect(list).toHaveTextContent('a.webp')
    expect(list).toHaveTextContent('100KB')
  })

  it('上限に収まらなかったものを警告として出す', () => {
    renderEditor({
      convertResults: [
        { filename: 'a.webp', bytes: 307200, withinLimit: false, error: null },
      ],
    })

    expect(screen.getByTestId('convert-results')).toHaveTextContent(
      '200KBに収まりませんでした',
    )
  })

  it('失敗したものは容量ではなく理由を出す', () => {
    renderEditor({
      convertResults: [
        {
          filename: 'broken.png',
          bytes: 0,
          withinLimit: false,
          error: '画像を読み込めませんでした。',
        },
      ],
    })

    const list = screen.getByTestId('convert-results')
    expect(list).toHaveTextContent('画像を読み込めませんでした。')
    expect(list).not.toHaveTextContent('0KB')
  })

  it('保存したZIPのファイル名を出す', () => {
    renderEditor({ convertZipFilename: 'images-20260830-174100.zip' })

    expect(screen.getByTestId('convert-zip')).toHaveTextContent(
      'images-20260830-174100.zip に保存しました',
    )
  })

  it('ZIPの作成に失敗したら理由を出す', () => {
    renderEditor({ convertError: 'ZIPの作成に失敗しました。' })

    expect(screen.getByTestId('convert-error')).toHaveTextContent(
      'ZIPの作成に失敗しました。',
    )
  })

  // 同名ファイルが並んでもキーが衝突しないこと
  it('同じ名前の結果が並んでも全件表示する', () => {
    renderEditor({
      convertResults: [
        { filename: 'a.webp', bytes: 1024, withinLimit: true, error: null },
        { filename: 'a.webp', bytes: 2048, withinLimit: true, error: null },
      ],
    })

    expect(screen.getAllByText('a.webp')).toHaveLength(2)
  })
})
