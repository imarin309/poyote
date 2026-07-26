import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { captureThumbnailBlob } from './captureThumbnail'

function createVideoStub(
  overrides: Partial<
    Record<'readyState' | 'videoWidth' | 'videoHeight', number>
  > = {},
): HTMLVideoElement {
  return {
    readyState: 2,
    HAVE_CURRENT_DATA: 2,
    videoWidth: 320,
    videoHeight: 180,
    ...overrides,
  } as unknown as HTMLVideoElement
}

describe('captureThumbnailBlob', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('readyStateが不足していると例外を投げる', async () => {
    await expect(
      captureThumbnailBlob(createVideoStub({ readyState: 0 })),
    ).rejects.toThrow('サムネイルを生成できる状態ではありません。')
  })

  it('動画サイズが取得できないと例外を投げる', async () => {
    await expect(
      captureThumbnailBlob(createVideoStub({ videoWidth: 0, videoHeight: 0 })),
    ).rejects.toThrow('動画のサイズを取得できませんでした。')
  })

  it('WebPが生成できればWebPのBlobを返す', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      function (callback, type) {
        callback(new Blob([], { type: type ?? 'image/webp' }))
      },
    )

    const blob = await captureThumbnailBlob(createVideoStub())

    expect(blob.type).toBe('image/webp')
  })

  it('WebPが失敗するとJPEGにフォールバックする', async () => {
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation(function (callback, type) {
        callback(type === 'image/webp' ? null : new Blob([], { type }))
      })

    const blob = await captureThumbnailBlob(createVideoStub())

    expect(blob.type).toBe('image/jpeg')
    expect(toBlob).toHaveBeenCalledTimes(2)
  })

  it('どの形式でも生成できない場合は例外を投げる', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      function (callback) {
        callback(null)
      },
    )

    await expect(captureThumbnailBlob(createVideoStub())).rejects.toThrow(
      'サムネイルの生成に失敗しました。',
    )
  })

  it('WebPが非対応でnullを返さずPNGに暗黙フォールバックしてもJPEGを試す', async () => {
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation(function (callback, type) {
        // canvas.toBlobは非対応typeでもnullではなくimage/pngを黙って返すことがある
        if (type === 'image/webp') {
          callback(new Blob([], { type: 'image/png' }))
        } else {
          callback(new Blob([], { type }))
        }
      })

    const blob = await captureThumbnailBlob(createVideoStub())

    expect(blob.type).toBe('image/jpeg')
    expect(toBlob).toHaveBeenCalledTimes(2)
  })

  it('全形式がPNGに暗黙フォールバックした場合はそのPNGを採用する', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      function (callback) {
        callback(new Blob([], { type: 'image/png' }))
      },
    )

    const blob = await captureThumbnailBlob(createVideoStub())

    expect(blob.type).toBe('image/png')
  })
})
