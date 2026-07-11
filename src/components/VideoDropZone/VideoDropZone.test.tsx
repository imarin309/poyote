import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VideoDropZone } from './VideoDropZone'

describe('VideoDropZone', () => {
  it('ファイル選択でonFileSelectedが呼ばれる', () => {
    const onFileSelected = vi.fn()
    render(<VideoDropZone onFileSelected={onFileSelected} error={null} />)

    const file = new File([''], 'clip.mp4', { type: 'video/mp4' })
    const input = screen.getByTestId('video-file-input')

    fireEvent.change(input, { target: { files: [file] } })

    expect(onFileSelected).toHaveBeenCalledWith(file)
  })

  it('ドロップでonFileSelectedが呼ばれる', () => {
    const onFileSelected = vi.fn()
    render(<VideoDropZone onFileSelected={onFileSelected} error={null} />)

    const file = new File([''], 'clip.mp4', { type: 'video/mp4' })
    const dropZone = screen.getByTestId('video-drop-zone')

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    })

    expect(onFileSelected).toHaveBeenCalledWith(file)
  })

  it('エラーがある場合メッセージを表示する', () => {
    render(
      <VideoDropZone onFileSelected={vi.fn()} error="動画ファイルを選択してください。" />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      '動画ファイルを選択してください。',
    )
  })
})
