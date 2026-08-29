import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ImagePanel } from './ImagePanel'
import type { LoadedImage } from '../../types/image'

const image: LoadedImage = {
  file: new File([''], 'photo.png', { type: 'image/png' }),
  objectUrl: 'blob:image',
}

type Props = Parameters<typeof ImagePanel>[0]

function renderPanel(overrides: Partial<Props> = {}) {
  const props: Props = {
    image,
    baseFileName: 'photo',
    onBaseFileNameChange: vi.fn(),
    onCrop: vi.fn(),
    onChangeImage: vi.fn(),
    isSaving: false,
    error: null,
    lastSaved: null,
    ...overrides,
  }

  render(<ImagePanel {...props} />)
  return props
}

describe('ImagePanel', () => {
  it('読み込んだ画像のファイル名を表示する', () => {
    renderPanel()
    expect(screen.getByText('photo.png')).toBeInTheDocument()
  })

  it('ファイル名の編集でonBaseFileNameChangeが呼ばれる', () => {
    const props = renderPanel()
    fireEvent.change(screen.getByLabelText('ファイル名'), {
      target: { value: 'cover' },
    })
    expect(props.onBaseFileNameChange).toHaveBeenCalledWith('cover')
  })

  it('トリミングボタンでonCropが呼ばれる', () => {
    const props = renderPanel()
    fireEvent.click(screen.getByTestId('image-crop-button'))
    expect(props.onCrop).toHaveBeenCalled()
  })

  it('画像を変更ボタンでonChangeImageが呼ばれる', () => {
    const props = renderPanel()
    fireEvent.click(screen.getByTestId('change-image-button'))
    expect(props.onChangeImage).toHaveBeenCalled()
  })

  it('保存中は操作ボタンを無効にする', () => {
    renderPanel({ isSaving: true })
    expect(screen.getByTestId('image-crop-button')).toBeDisabled()
    expect(screen.getByTestId('change-image-button')).toBeDisabled()
  })

  it('直前に保存した画像を表示する', () => {
    renderPanel({
      lastSaved: { objectUrl: 'blob:saved', filename: 'photo.jpg' },
    })
    expect(screen.getByText('photo.jpg')).toBeInTheDocument()
  })

  it('エラーがある場合メッセージを表示する', () => {
    renderPanel({ error: '画像の保存に失敗しました。' })
    expect(screen.getByRole('alert')).toHaveTextContent(
      '画像の保存に失敗しました。',
    )
  })
})
