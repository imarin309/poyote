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
    current: image,
    index: 0,
    total: 1,
    savedCount: 0,
    skippedCount: 0,
    isFinished: false,
    baseFileName: 'photo',
    onBaseFileNameChange: vi.fn(),
    onResumeCrop: vi.fn(),
    onConvertAll: vi.fn(),
    onChangeImages: vi.fn(),
    isSaving: false,
    error: null,
    lastCapture: null,
    isConverting: false,
    convertProgress: { current: 0, total: 0 },
    convertResults: [],
    convertError: null,
    ...overrides,
  }

  render(<ImagePanel {...props} />)
  return props
}

describe('ImagePanel', () => {
  it('処理中の画像のファイル名を表示する', () => {
    renderPanel()
    expect(screen.getByText('photo.png')).toBeInTheDocument()
  })

  it('一括処理中は進捗を表示する', () => {
    renderPanel({ index: 2, total: 10 })
    expect(screen.getByTestId('queue-progress')).toHaveTextContent('3 / 10 件')
  })

  it('トリミングボタンでonResumeCropが呼ばれる', () => {
    const props = renderPanel()
    fireEvent.click(screen.getByTestId('image-crop-button'))
    expect(props.onResumeCrop).toHaveBeenCalled()
  })

  it('完了後は保存件数とスキップ件数のサマリを表示する', () => {
    renderPanel({
      current: null,
      index: 10,
      total: 10,
      savedCount: 8,
      skippedCount: 2,
      isFinished: true,
    })
    expect(screen.getByTestId('queue-summary')).toHaveTextContent(
      '10 件中 8 件を保存、2 件スキップ',
    )
  })

  it('完了後はトリミングボタンを出さない', () => {
    renderPanel({ current: null, isFinished: true, total: 3 })
    expect(screen.queryByTestId('image-crop-button')).not.toBeInTheDocument()
    expect(screen.getByTestId('change-image-button')).toHaveTextContent(
      '別の画像を選ぶ',
    )
  })

  it('保存中は操作ボタンを無効にする', () => {
    renderPanel({ isSaving: true })
    expect(screen.getByTestId('image-crop-button')).toBeDisabled()
    expect(screen.getByTestId('change-image-button')).toBeDisabled()
  })

  it('直前に保存した画像を表示する', () => {
    renderPanel({
      lastCapture: { objectUrl: 'blob:saved', filename: 'photo.jpg' },
    })
    expect(screen.getByText('photo.jpg')).toBeInTheDocument()
  })

  it('エラーがある場合メッセージを表示する', () => {
    renderPanel({ error: '画像の保存に失敗しました。' })
    expect(screen.getByRole('alert')).toHaveTextContent(
      '画像の保存に失敗しました。',
    )
  })

  it('一括変換ボタンでonConvertAllが呼ばれる', () => {
    const props = renderPanel({ total: 5 })
    fireEvent.click(screen.getByTestId('convert-all-button'))
    expect(props.onConvertAll).toHaveBeenCalled()
  })

  it('一括変換ボタンに対象件数を出す', () => {
    renderPanel({ total: 5 })
    expect(screen.getByTestId('convert-all-button')).toHaveTextContent(
      '比率そのままで一括変換（5件）',
    )
  })

  it('変換中は進捗を出して操作を止める', () => {
    renderPanel({
      total: 5,
      isConverting: true,
      convertProgress: { current: 2, total: 5 },
    })
    const button = screen.getByTestId('convert-all-button')
    expect(button).toHaveTextContent('変換中… 2 / 5')
    expect(button).toBeDisabled()
    expect(screen.getByTestId('image-crop-button')).toBeDisabled()
  })

  it('変換結果をファイル名と容量で一覧表示する', () => {
    renderPanel({
      total: 2,
      convertResults: [
        { filename: 'a.webp', bytes: 102400, withinLimit: true },
        { filename: 'b.webp', bytes: 256000, withinLimit: false },
      ],
    })
    const results = screen.getByTestId('convert-results')
    expect(results).toHaveTextContent('a.webp')
    expect(results).toHaveTextContent('100.0 KB')
    expect(results).toHaveTextContent('250.0 KB')
    expect(results).toHaveTextContent('うち 1 件は 200KB に収まりませんでした')
  })

  it('変換中は結果一覧を出さない', () => {
    renderPanel({
      isConverting: true,
      convertResults: [{ filename: 'a.webp', bytes: 1024, withinLimit: true }],
    })
    expect(screen.queryByTestId('convert-results')).not.toBeInTheDocument()
  })
})
