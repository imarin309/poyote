import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CropModal } from './CropModal'
import { ASPECT_PRESETS } from '../../utils/aspectPresets'

const crop = { x: 100, y: 50, width: 400, height: 225 }

function renderModal(overrides: Partial<Parameters<typeof CropModal>[0]> = {}) {
  const props = {
    previewUrl: 'blob:preview',
    presetIndex: 0,
    crop,
    isSaving: false,
    error: null,
    onSelectPreset: vi.fn(),
    onMeasure: vi.fn(),
    onBeginDrag: vi.fn(),
    onPointerMove: vi.fn(),
    onEndDrag: vi.fn(),
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }

  render(<CropModal {...props} />)
  return props
}

describe('CropModal', () => {
  it('選択中プリセットの出力サイズを表示する', () => {
    renderModal({ presetIndex: 1 })
    const preset = ASPECT_PRESETS[1]
    expect(
      screen.getByText(new RegExp(`${preset.width}×${preset.height}px`)),
    ).toBeInTheDocument()
  })

  it('プリセットボタンでonSelectPresetが呼ばれる', () => {
    const props = renderModal()
    fireEvent.click(
      screen.getByRole('button', { name: ASPECT_PRESETS[2].label }),
    )
    expect(props.onSelectPreset).toHaveBeenCalledWith(2)
  })

  it('切り取り範囲をcropの座標どおりに配置する', () => {
    renderModal()
    expect(screen.getByTestId('crop-area')).toHaveStyle({
      left: '100px',
      top: '50px',
      width: '400px',
      height: '225px',
    })
  })

  it('四隅のハンドルを切り取り範囲の角に配置する', () => {
    renderModal()
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
    const props = renderModal()
    fireEvent.pointerDown(screen.getByTestId('crop-handle-ne'))
    expect(props.onBeginDrag).toHaveBeenCalledWith('ne', expect.anything())
  })

  it('保存ボタンでonConfirmが呼ばれる', () => {
    const props = renderModal()
    fireEvent.click(screen.getByTestId('crop-confirm-button'))
    expect(props.onConfirm).toHaveBeenCalled()
  })

  it('切り取り範囲が未確定の間は保存できない', () => {
    renderModal({ crop: null })
    expect(screen.getByTestId('crop-confirm-button')).toBeDisabled()
  })

  it('Escapeでダイアログを閉じる', () => {
    const props = renderModal()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(props.onClose).toHaveBeenCalled()
  })

  it('エラーがある場合メッセージを表示する', () => {
    renderModal({ error: '画像の保存に失敗しました。' })
    expect(screen.getByRole('alert')).toHaveTextContent(
      '画像の保存に失敗しました。',
    )
  })

  it('一括処理では進捗と対象ファイル名を表示する', () => {
    renderModal({ progress: { current: 3, total: 10 }, filename: 'photo.png' })
    expect(screen.getByText('3 / 10 件')).toBeInTheDocument()
    expect(screen.getByText('photo.png')).toBeInTheDocument()
  })

  it('onSkipが渡された場合だけスキップボタンを出す', () => {
    const onSkip = vi.fn()
    renderModal({ onSkip, progress: { current: 1, total: 3 } })
    fireEvent.click(screen.getByTestId('crop-skip-button'))
    expect(onSkip).toHaveBeenCalled()
  })

  it('単体処理ではスキップボタンを出さない', () => {
    renderModal()
    expect(screen.queryByTestId('crop-skip-button')).not.toBeInTheDocument()
  })

  it('一括処理ではキャンセルを全てキャンセルと表示する', () => {
    renderModal({ progress: { current: 1, total: 3 } })
    expect(screen.getByTestId('crop-cancel-button')).toHaveTextContent(
      '全てキャンセル',
    )
  })

  it('単体処理ではキャンセルと表示する', () => {
    renderModal({ progress: { current: 1, total: 1 } })
    expect(screen.getByTestId('crop-cancel-button')).toHaveTextContent(
      'キャンセル',
    )
  })
})
