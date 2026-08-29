import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ImagePage } from './ImagePage'

function selectFile(name = 'photo.png', type = 'image/png') {
  const file = new File([''], name, { type })
  fireEvent.change(screen.getByTestId('image-file-input'), {
    target: { files: [file] },
  })
  return file
}

describe('ImagePage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => 'blob:mock'),
        revokeObjectURL: vi.fn(),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function renderPage() {
    render(
      <ImagePage route="image" onNavigate={vi.fn()} onOpenHelp={vi.fn()} />,
    )
  }

  it('画像を読み込むとそのまま切り取りモーダルが開く', () => {
    renderPage()
    selectFile()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('画像以外を読み込んでもモーダルは開かない', () => {
    renderPage()
    selectFile('clip.mp4', 'video/mp4')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      '画像ファイルを選択してください。',
    )
  })

  it('キャンセルするとパネルに戻り、トリミングをやり直せる', () => {
    renderPage()
    selectFile()

    fireEvent.click(screen.getByTestId('crop-cancel-button'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('image-crop-button'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('画像を変更するとドロップゾーンに戻る', () => {
    renderPage()
    selectFile()

    fireEvent.click(screen.getByTestId('crop-cancel-button'))
    fireEvent.click(screen.getByTestId('change-image-button'))

    expect(screen.getByTestId('image-drop-zone')).toBeInTheDocument()
  })

  it('ファイル名の初期値は拡張子を除いた元のファイル名', () => {
    renderPage()
    selectFile('my.photo.png')

    fireEvent.click(screen.getByTestId('crop-cancel-button'))
    expect(screen.getByLabelText('ファイル名')).toHaveValue('my.photo')
  })
})
