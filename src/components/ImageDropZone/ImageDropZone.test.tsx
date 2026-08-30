import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ImageDropZone } from './ImageDropZone'

describe('ImageDropZone', () => {
  it('ファイル選択でonFilesSelectedが呼ばれる', () => {
    const onFilesSelected = vi.fn()
    render(<ImageDropZone onFilesSelected={onFilesSelected} error={null} />)

    const file = new File([''], 'photo.png', { type: 'image/png' })

    fireEvent.change(screen.getByTestId('image-file-input'), {
      target: { files: [file] },
    })

    expect(onFilesSelected).toHaveBeenCalledWith([file])
  })

  it('複数のファイルをまとめて渡す', () => {
    const onFilesSelected = vi.fn()
    render(<ImageDropZone onFilesSelected={onFilesSelected} error={null} />)

    const files = [
      new File([''], 'a.png', { type: 'image/png' }),
      new File([''], 'b.png', { type: 'image/png' }),
    ]

    fireEvent.drop(screen.getByTestId('image-drop-zone'), {
      dataTransfer: { files },
    })

    expect(onFilesSelected).toHaveBeenCalledWith(files)
  })

  it('画像ファイルを複数選べるようにする', () => {
    render(<ImageDropZone onFilesSelected={vi.fn()} error={null} />)
    const input = screen.getByTestId('image-file-input')
    expect(input).toHaveAttribute('accept', 'image/*')
    expect(input).toHaveAttribute('multiple')
  })

  it('エラーがある場合メッセージを表示する', () => {
    render(
      <ImageDropZone
        onFilesSelected={vi.fn()}
        error="画像ファイルを選択してください。"
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      '画像ファイルを選択してください。',
    )
  })
})
