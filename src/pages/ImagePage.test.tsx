import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ImagePage } from './ImagePage'

function imageFile(name = 'photo.png', type = 'image/png') {
  return new File([''], name, { type })
}

function selectFiles(...files: File[]) {
  fireEvent.change(screen.getByTestId('image-file-input'), {
    target: { files },
  })
  return files
}

function renderPage() {
  render(<ImagePage route="image" onNavigate={vi.fn()} onOpenHelp={vi.fn()} />)
}

describe('ImagePage', () => {
  beforeEach(() => {
    let counter = 0
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => `blob:mock-${counter++}`),
        revokeObjectURL: vi.fn(),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('画像を読み込むとそのまま切り取り画面になる', () => {
    renderPage()
    selectFiles(imageFile())

    expect(screen.getByTestId('crop-save-button')).toBeInTheDocument()
    expect(screen.queryByTestId('image-drop-zone')).not.toBeInTheDocument()
  })

  it('切り取りはオーバーレイではなくページ内に出す', () => {
    renderPage()
    selectFiles(imageFile())

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('画像以外を読み込んでもドロップゾーンのままエラーを出す', () => {
    renderPage()
    selectFiles(imageFile('clip.mp4', 'video/mp4'))

    expect(screen.queryByTestId('crop-save-button')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      '画像ファイルを選択してください。',
    )
  })

  it('画像を変更するとドロップゾーンに戻る', () => {
    renderPage()
    selectFiles(imageFile())

    fireEvent.click(screen.getByTestId('change-image-button'))

    expect(screen.getByTestId('image-drop-zone')).toBeInTheDocument()
  })

  it('ファイル名の初期値は拡張子を除いた元のファイル名', () => {
    renderPage()
    selectFiles(imageFile('my.photo.png'))

    expect(screen.getByLabelText('ファイル名')).toHaveValue('my.photo')
  })
})

describe('ImagePage の複数枚処理', () => {
  beforeEach(() => {
    let counter = 0
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => `blob:mock-${counter++}`),
        revokeObjectURL: vi.fn(),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('複数枚を読み込むと1件目から進捗を出す', () => {
    renderPage()
    selectFiles(imageFile('a.png'), imageFile('b.png'))

    expect(screen.getByTestId('queue-progress')).toHaveTextContent('1 / 2 件')
    expect(screen.getByLabelText('ファイル名')).toHaveValue('a')
  })

  it('スキップで次の画像に進む', () => {
    renderPage()
    selectFiles(imageFile('a.png'), imageFile('b.png'))

    fireEvent.click(screen.getByTestId('skip-image-button'))

    expect(screen.getByTestId('queue-progress')).toHaveTextContent('2 / 2 件')
    expect(screen.getByLabelText('ファイル名')).toHaveValue('b')
  })

  it('最後まで進むと完了サマリを出す', () => {
    renderPage()
    selectFiles(imageFile('a.png'), imageFile('b.png'))

    fireEvent.click(screen.getByTestId('skip-image-button'))
    fireEvent.click(screen.getByTestId('skip-image-button'))

    expect(screen.getByTestId('queue-summary')).toHaveTextContent(
      '2 件中 0 件を保存、2 件スキップ',
    )
    expect(screen.queryByTestId('crop-save-button')).not.toBeInTheDocument()
  })

  // 「全てキャンセル」は閉じる先が無いので、読み込んだ画像は残したままにする
  it('全てキャンセルしても画像は残り、最初からやり直せる', () => {
    renderPage()
    selectFiles(imageFile('a.png'), imageFile('b.png'))

    fireEvent.click(screen.getByTestId('cancel-queue-button'))
    expect(screen.getByTestId('queue-summary')).toBeInTheDocument()
    expect(screen.queryByTestId('image-drop-zone')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('restart-queue-button'))

    expect(screen.getByTestId('queue-progress')).toHaveTextContent('1 / 2 件')
    expect(screen.getByLabelText('ファイル名')).toHaveValue('a')
  })

  // ドロップゾーンは読み込み成功と同時に消えるため、編集画面にも警告を出す
  it('除外したファイルの警告を編集画面に出す', () => {
    renderPage()
    selectFiles(imageFile('a.png'), imageFile('clip.mp4', 'video/mp4'))

    expect(screen.getByTestId('image-notice')).toHaveTextContent(
      '画像でないファイル1件を除外しました。',
    )
  })
})
