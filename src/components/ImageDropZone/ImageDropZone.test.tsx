import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ImageDropZone } from './ImageDropZone'

describe('ImageDropZone', () => {
  it('ファイル選択でonFileSelectedが呼ばれる', () => {
    const onFileSelected = vi.fn()
    render(<ImageDropZone onFileSelected={onFileSelected} error={null} />)

    const file = new File([''], 'photo.png', { type: 'image/png' })

    fireEvent.change(screen.getByTestId('image-file-input'), {
      target: { files: [file] },
    })

    expect(onFileSelected).toHaveBeenCalledWith(file)
  })

  it('ドロップでonFileSelectedが呼ばれる', () => {
    const onFileSelected = vi.fn()
    render(<ImageDropZone onFileSelected={onFileSelected} error={null} />)

    const file = new File([''], 'photo.png', { type: 'image/png' })

    fireEvent.drop(screen.getByTestId('image-drop-zone'), {
      dataTransfer: { files: [file] },
    })

    expect(onFileSelected).toHaveBeenCalledWith(file)
  })

  it('画像ファイルだけを選べるようにする', () => {
    render(<ImageDropZone onFileSelected={vi.fn()} error={null} />)
    expect(screen.getByTestId('image-file-input')).toHaveAttribute(
      'accept',
      'image/*',
    )
  })

  it('エラーがある場合メッセージを表示する', () => {
    render(
      <ImageDropZone
        onFileSelected={vi.fn()}
        error="画像ファイルを選択してください。"
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      '画像ファイルを選択してください。',
    )
  })
})
