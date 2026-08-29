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

  it('画像を読み込むとそのまま切り取り画面になる', () => {
    renderPage()
    selectFile()

    expect(screen.getByTestId('crop-save-button')).toBeInTheDocument()
    expect(screen.queryByTestId('image-drop-zone')).not.toBeInTheDocument()
  })

  it('切り取りはオーバーレイではなくページ内に出す', () => {
    renderPage()
    selectFile()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('画像以外を読み込んでもドロップゾーンのままエラーを出す', () => {
    renderPage()
    selectFile('clip.mp4', 'video/mp4')

    expect(screen.queryByTestId('crop-save-button')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      '画像ファイルを選択してください。',
    )
  })

  it('画像を変更するとドロップゾーンに戻る', () => {
    renderPage()
    selectFile()

    fireEvent.click(screen.getByTestId('change-image-button'))

    expect(screen.getByTestId('image-drop-zone')).toBeInTheDocument()
  })

  it('ファイル名の初期値は拡張子を除いた元のファイル名', () => {
    renderPage()
    selectFile('my.photo.png')

    expect(screen.getByLabelText('ファイル名')).toHaveValue('my.photo')
  })
})
