import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { encodeCanvasWithinSize } from './encodeImage'
import { MIN_QUALITY } from '../utils/imageQuality'

interface ToBlobCall {
  type: string
  quality: number
}

// 品質が下がるほど小さくなるBlobを返す偽のtoBlob。
// sizeAt で「その品質のときの容量」を決められるようにしておく
function stubToBlob(
  calls: ToBlobCall[],
  sizeAt: (type: string, quality: number) => number | null,
  actualType: (type: string) => string = (type) => type,
) {
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    function (callback, type, quality) {
      const mimeType = type ?? 'image/png'
      const value = quality ?? 1
      calls.push({ type: mimeType, quality: value })

      const size = sizeAt(mimeType, value)
      if (size === null) {
        callback(null)
        return
      }

      callback(new Blob(['x'.repeat(size)], { type: actualType(mimeType) }))
    },
  )
}

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 100
  canvas.height = 100
  return canvas
}

describe('encodeCanvasWithinSize', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('初回で上限に収まればその品質のまま確定する', async () => {
    const calls: ToBlobCall[] = []
    stubToBlob(calls, () => 100)

    const blob = await encodeCanvasWithinSize(createCanvas(), 200)

    expect(blob.type).toBe('image/webp')
    expect(calls).toEqual([{ type: 'image/webp', quality: 0.85 }])
  })

  it('上限を超える間は品質を下げ、収まった時点で確定する', async () => {
    const calls: ToBlobCall[] = []
    // 0.75 で初めて上限以下になる
    stubToBlob(calls, (_type, quality) => (quality <= 0.75 ? 200 : 300))

    const blob = await encodeCanvasWithinSize(createCanvas(), 200)

    expect(blob.size).toBe(200)
    expect(calls.map((call) => call.quality)).toEqual([0.85, 0.8, 0.75])
  })

  it('下限の品質でも上限を超える場合はもっとも小さい結果を返す', async () => {
    const calls: ToBlobCall[] = []
    stubToBlob(calls, (_type, quality) => Math.round(quality * 1000))

    const blob = await encodeCanvasWithinSize(createCanvas(), 200)

    expect(calls[calls.length - 1].quality).toBe(MIN_QUALITY)
    expect(blob.size).toBe(Math.round(MIN_QUALITY * 1000))
  })

  it('webpが非対応でnullを返す環境ではjpegにフォールバックする', async () => {
    const calls: ToBlobCall[] = []
    stubToBlob(calls, (type) => (type === 'image/webp' ? null : 100))

    const blob = await encodeCanvasWithinSize(createCanvas(), 200)

    expect(blob.type).toBe('image/jpeg')
  })

  it('webpが非対応でpngに暗黙フォールバックする環境でもjpegを試す', async () => {
    // canvas.toBlobは非対応のtypeでもnullではなく既定形式を黙って返すことがある
    const calls: ToBlobCall[] = []
    stubToBlob(
      calls,
      () => 100,
      (type) => (type === 'image/webp' ? 'image/png' : type),
    )

    const blob = await encodeCanvasWithinSize(createCanvas(), 200)

    expect(blob.type).toBe('image/jpeg')
    expect(calls.map((call) => call.type)).toEqual(['image/webp', 'image/jpeg'])
  })

  it('webpもjpegも生成できない場合は例外を投げる', async () => {
    const calls: ToBlobCall[] = []
    stubToBlob(calls, () => null)

    await expect(encodeCanvasWithinSize(createCanvas(), 200)).rejects.toThrow(
      '画像の生成に失敗しました。',
    )
  })
})
