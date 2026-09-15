import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useImageCrop } from './useImageCrop'
import { cropImageToBlob } from '../services/cropImage'
import { ASPECT_PRESETS, presetRatio } from '../utils/aspectPresets'

vi.mock('../services/cropImage', () => ({
  cropImageToBlob: vi.fn(() =>
    Promise.resolve(new Blob([''], { type: 'image/jpeg' })),
  ),
}))

// jsdom はレイアウトしないので、表示サイズと実サイズを持つ <img> を用意する
const NATURAL = { width: 1600, height: 900 }

const ORIGINAL_INDEX = ASPECT_PRESETS.findIndex(
  (preset) => preset.kind === 'original',
)

function fakeImage(
  display = { width: 800, height: 450 },
  natural = NATURAL,
): HTMLImageElement {
  const image = document.createElement('img')
  const define = (name: string, value: number) =>
    Object.defineProperty(image, name, { configurable: true, value })
  define('clientWidth', display.width)
  define('clientHeight', display.height)
  define('naturalWidth', natural.width)
  define('naturalHeight', natural.height)
  return image
}

function setup(
  save = vi.fn(async (createBlob: () => Promise<Blob>) => {
    await createBlob()
    return true
  }),
) {
  const hook = renderHook(() => useImageCrop({ save }))
  return { ...hook, save }
}

describe('useImageCrop', () => {
  beforeEach(() => {
    vi.mocked(cropImageToBlob).mockClear()
  })

  it('計測するまで切り取り範囲を持たない', () => {
    const { result } = setup()
    expect(result.current.crop).toBeNull()
  })

  it('計測すると選択中プリセットの比率で中央に作られる', () => {
    const { result } = setup()

    act(() => {
      result.current.measure(fakeImage())
    })

    const crop = result.current.crop
    expect(crop).not.toBeNull()
    expect(crop!.width / crop!.height).toBeCloseTo(
      presetRatio(ASPECT_PRESETS[0], NATURAL),
    )
  })

  it('表示サイズが0の場合は作らない', () => {
    const { result } = setup()

    act(() => {
      result.current.measure(fakeImage({ width: 0, height: 0 }))
    })

    expect(result.current.crop).toBeNull()
  })

  it('プリセットを変えると新しい比率で作り直す', () => {
    const { result } = setup()

    act(() => {
      result.current.measure(fakeImage())
    })
    act(() => {
      result.current.selectPreset(2)
    })

    expect(result.current.presetIndex).toBe(2)
    const crop = result.current.crop
    expect(crop!.width / crop!.height).toBeCloseTo(
      presetRatio(ASPECT_PRESETS[2], NATURAL),
    )
  })

  it('resetで切り取り範囲を捨てるがプリセットは維持する', () => {
    const { result } = setup()

    act(() => {
      result.current.measure(fakeImage())
    })
    act(() => {
      result.current.selectPreset(1)
    })
    act(() => {
      result.current.reset()
    })

    expect(result.current.crop).toBeNull()
    expect(result.current.presetIndex).toBe(1)
  })

  it('計測前のconfirmは保存せずfalseを返す', async () => {
    const { result, save } = setup()

    let confirmed = true
    await act(async () => {
      confirmed = await result.current.confirm()
    })

    expect(confirmed).toBe(false)
    expect(save).not.toHaveBeenCalled()
  })

  it('confirmは表示座標を元画像の座標に直してプリセットのサイズで書き出す', async () => {
    const { result } = setup()

    act(() => {
      result.current.measure(fakeImage())
    })
    await act(async () => {
      await result.current.confirm()
    })

    const preset = ASPECT_PRESETS[0]
    if (preset.kind !== 'fixed') {
      throw new Error('固定サイズのプリセットを前提にしている')
    }
    const [, sourceRect, targetSize] = vi.mocked(cropImageToBlob).mock.calls[0]
    // 表示800x450に対し元画像は1600x900なので、切り取り範囲は2倍になる
    expect(sourceRect).toEqual({
      left: 0,
      top: 0,
      width: 1600,
      height: 900,
    })
    expect(targetSize).toEqual({
      width: preset.width,
      height: preset.height,
    })
  })

  it('「そのまま」は画像全体を選び、切り取った範囲のピクセル数で書き出す', async () => {
    const { result } = setup()

    act(() => {
      result.current.selectPreset(ORIGINAL_INDEX)
    })
    act(() => {
      result.current.measure(
        fakeImage({ width: 400, height: 600 }, { width: 1200, height: 1800 }),
      )
    })

    expect(result.current.crop).toEqual({ x: 0, y: 0, width: 400, height: 600 })

    await act(async () => {
      await result.current.confirm()
    })

    const [, sourceRect, targetSize] = vi.mocked(cropImageToBlob).mock.calls[0]
    expect(sourceRect).toEqual({ left: 0, top: 0, width: 1200, height: 1800 })
    expect(targetSize).toEqual({ width: 1200, height: 1800 })
  })

  it('「そのまま」でリサイズしても元画像の比率を保つ', () => {
    const { result } = setup()
    const natural = { width: 1200, height: 1800 }

    act(() => {
      result.current.selectPreset(ORIGINAL_INDEX)
    })
    act(() => {
      result.current.measure(fakeImage({ width: 400, height: 600 }, natural))
    })
    act(() => {
      result.current.resizeByKey('se', {
        key: 'ArrowLeft',
        shiftKey: true,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLElement>)
    })

    const crop = result.current.crop!
    expect(crop.width).toBeLessThan(400)
    expect(crop.width / crop.height).toBeCloseTo(natural.width / natural.height)
  })

  it('矢印キーで切り取り範囲をリサイズできる', () => {
    const { result } = setup()

    act(() => {
      result.current.measure(fakeImage({ width: 800, height: 600 }))
    })
    const before = result.current.crop!.width

    act(() => {
      result.current.resizeByKey('se', {
        key: 'ArrowLeft',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLElement>)
    })

    expect(result.current.crop!.width).toBeLessThan(before)
    expect(
      result.current.crop!.width / result.current.crop!.height,
    ).toBeCloseTo(presetRatio(ASPECT_PRESETS[0], NATURAL))
  })

  it('対応しないキーでは何も起きない', () => {
    const { result } = setup()

    act(() => {
      result.current.measure(fakeImage({ width: 800, height: 600 }))
    })
    const before = result.current.crop

    act(() => {
      result.current.resizeByKey('se', {
        key: 'Enter',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLElement>)
    })

    expect(result.current.crop).toBe(before)
  })
})
