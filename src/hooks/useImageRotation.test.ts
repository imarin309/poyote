import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useImageRotation } from './useImageRotation'
import { loadImageElement } from '../services/loadImageElement'

vi.mock('../services/loadImageElement', () => ({
  loadImageElement: vi.fn(),
}))

function fakeImage(width = 800, height = 450): HTMLImageElement {
  const image = new Image()
  Object.defineProperty(image, 'naturalWidth', { value: width })
  Object.defineProperty(image, 'naturalHeight', { value: height })
  return image
}

// jsdomはcanvasの描画に対応していないので、呼ばれた描画命令だけを数える
function stubCanvasContext() {
  const context = { translate: vi.fn(), rotate: vi.fn(), drawImage: vi.fn() }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  )
  return context
}

function setup(sourceUrl: string | null = 'blob:a') {
  const onRotated = vi.fn()
  const hook = renderHook(
    ({ url }: { url: string | null }) => useImageRotation(url, onRotated),
    { initialProps: { url: sourceUrl } },
  )
  return { ...hook, onRotated }
}

describe('useImageRotation', () => {
  beforeEach(() => {
    vi.mocked(loadImageElement).mockReset()
    vi.mocked(loadImageElement).mockResolvedValue(fakeImage())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('最初は回転していない', () => {
    const { result } = setup()
    expect(result.current.isRotated).toBe(false)
    expect(result.current.isRotating).toBe(false)
  })

  it('初めて回すと元画像を読み込み、切り取り範囲を作り直してもらう', async () => {
    const { result, onRotated } = setup()

    await act(async () => {
      await result.current.rotate('right')
    })

    expect(loadImageElement).toHaveBeenCalledWith('blob:a')
    expect(result.current.isRotated).toBe(true)
    expect(result.current.isRotating).toBe(false)
    expect(onRotated).toHaveBeenCalledTimes(1)
  })

  it('2回目以降は読み込んだ画像を使い回す', async () => {
    const { result, onRotated } = setup()

    await act(async () => {
      await result.current.rotate('right')
    })
    await act(async () => {
      await result.current.rotate('right')
    })

    expect(loadImageElement).toHaveBeenCalledTimes(1)
    expect(onRotated).toHaveBeenCalledTimes(2)
  })

  it('元の向きまで戻すと回転していない状態になる', async () => {
    const { result } = setup()

    await act(async () => {
      await result.current.rotate('right')
    })
    await act(async () => {
      await result.current.rotate('left')
    })

    expect(result.current.isRotated).toBe(false)
  })

  it('読み込みに失敗したらエラーを出し、回転していない状態に戻る', async () => {
    vi.mocked(loadImageElement).mockRejectedValue(
      new Error('画像を読み込めませんでした。'),
    )
    const { result, onRotated } = setup()

    await act(async () => {
      await result.current.rotate('right')
    })

    expect(result.current.error).toBe('画像を読み込めませんでした。')
    expect(result.current.isRotated).toBe(false)
    expect(result.current.isRotating).toBe(false)
    expect(onRotated).not.toHaveBeenCalled()
  })

  it('読み込み中に画像が切り替わったら、遅れて届いた結果は捨てる', async () => {
    let resolveLoad: (image: HTMLImageElement) => void = () => {}
    vi.mocked(loadImageElement).mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve
      }),
    )
    const { result, rerender, onRotated } = setup()

    let pending: Promise<void> = Promise.resolve()
    act(() => {
      pending = result.current.rotate('right')
    })
    expect(result.current.isRotating).toBe(true)

    rerender({ url: 'blob:b' })
    expect(result.current.isRotating).toBe(false)

    await act(async () => {
      resolveLoad(fakeImage())
      await pending
    })

    expect(result.current.isRotated).toBe(false)
    expect(onRotated).not.toHaveBeenCalled()
  })

  it('画像が切り替わると角度とエラーをリセットする', async () => {
    const { result, rerender } = setup()

    await act(async () => {
      await result.current.rotate('right')
    })
    rerender({ url: 'blob:b' })

    expect(result.current.isRotated).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('同じcanvasに同じ内容を描くときは描き直さない', async () => {
    const context = stubCanvasContext()
    const { result } = setup()
    await act(async () => {
      await result.current.rotate('right')
    })

    const canvas = document.createElement('canvas')
    act(() => {
      expect(result.current.drawPreview(canvas)).toBe(true)
      expect(result.current.drawPreview(canvas)).toBe(true)
    })

    expect(context.drawImage).toHaveBeenCalledTimes(1)
    expect(canvas.width).toBe(450)
    expect(canvas.height).toBe(800)
  })

  it('描けなかったらエラーを出し、元の向きに戻す', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { result, onRotated } = setup()
    await act(async () => {
      await result.current.rotate('right')
    })

    let drawn = true
    act(() => {
      drawn = result.current.drawPreview(document.createElement('canvas'))
    })

    expect(drawn).toBe(false)
    expect(result.current.isRotated).toBe(false)
    expect(result.current.error).toBe(
      'Canvasコンテキストを取得できませんでした。',
    )
    expect(onRotated).toHaveBeenCalledTimes(2)
  })
})
