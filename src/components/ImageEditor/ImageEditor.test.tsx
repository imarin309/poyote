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
    presetIndex: 0,
    crop,
    baseFileName: 'photo',
    isSaving: false,
    error: null,
    lastSaved: null,
    onSelectPreset: vi.fn(),
    onMeasure: vi.fn(),
    onBeginDrag: vi.fn(),
    onPointerMove: vi.fn(),
    onEndDrag: vi.fn(),
    onBaseFileNameChange: vi.fn(),
    onSave: vi.fn(),
    onChangeImage: vi.fn(),
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
})
