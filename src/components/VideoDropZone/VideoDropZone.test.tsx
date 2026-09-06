import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VideoDropZone } from './VideoDropZone'

describe('VideoDropZone', () => {
  it('ファイル選択でonFilesSelectedが呼ばれる', () => {
    const onFilesSelected = vi.fn()
    render(<VideoDropZone onFilesSelected={onFilesSelected} error={null} />)

    const file = new File([''], 'clip.mp4', { type: 'video/mp4' })
    const input = screen.getByTestId('video-file-input')

    fireEvent.change(input, { target: { files: [file] } })

    expect(onFilesSelected).toHaveBeenCalledWith([file])
  })

  it('複数ファイルを選択すると全件渡される', () => {
    const onFilesSelected = vi.fn()
    render(<VideoDropZone onFilesSelected={onFilesSelected} error={null} />)

    const files = [
      new File([''], 'a.mp4', { type: 'video/mp4' }),
      new File([''], 'b.mp4', { type: 'video/mp4' }),
    ]
    const input = screen.getByTestId('video-file-input')

    fireEvent.change(input, { target: { files } })

    expect(onFilesSelected).toHaveBeenCalledWith(files)
  })

  it('ドロップでonFilesSelectedが呼ばれる', () => {
    const onFilesSelected = vi.fn()
    render(<VideoDropZone onFilesSelected={onFilesSelected} error={null} />)

    const file = new File([''], 'clip.mp4', { type: 'video/mp4' })
    const dropZone = screen.getByTestId('video-drop-zone')

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    })

    expect(onFilesSelected).toHaveBeenCalledWith([file])
  })

  it('複数ファイルを選べる', () => {
    render(<VideoDropZone onFilesSelected={vi.fn()} error={null} />)

    expect(screen.getByTestId('video-file-input')).toHaveAttribute('multiple')
  })

  it('エラーがある場合メッセージを表示する', () => {
    render(
      <VideoDropZone
        onFilesSelected={vi.fn()}
        error="動画ファイルを選択してください。"
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      '動画ファイルを選択してください。',
    )
  })
})
