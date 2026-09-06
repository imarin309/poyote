import { beforeEach, describe, expect, it, vi } from 'vitest'
import { measureDuration } from './measureDuration'
import {
  createOffscreenVideo,
  disposeOffscreenVideo,
  waitForMetadata,
} from './offscreenVideo'

vi.mock('./offscreenVideo', () => ({
  createOffscreenVideo: vi.fn(),
  waitForMetadata: vi.fn(),
  disposeOffscreenVideo: vi.fn(),
}))

const createMock = vi.mocked(createOffscreenVideo)
const waitMock = vi.mocked(waitForMetadata)
const disposeMock = vi.mocked(disposeOffscreenVideo)

function offscreenVideo(duration: number) {
  return { duration } as HTMLVideoElement
}

describe('measureDuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    waitMock.mockResolvedValue(undefined)
  })

  it('メタデータから読めた長さを秒で返す', async () => {
    createMock.mockReturnValue(offscreenVideo(12.5))

    await expect(measureDuration('blob:a')).resolves.toBe(12.5)
    expect(createMock).toHaveBeenCalledWith('blob:a')
  })

  it('長さが非有限なら不明として null を返す', async () => {
    createMock.mockReturnValue(offscreenVideo(Infinity))

    await expect(measureDuration('blob:a')).resolves.toBeNull()
  })

  it('長さが0なら不明として null を返す', async () => {
    createMock.mockReturnValue(offscreenVideo(0))

    await expect(measureDuration('blob:a')).resolves.toBeNull()
  })

  it('メタデータを読めなければ例外がそのまま伝わる', async () => {
    createMock.mockReturnValue(offscreenVideo(0))
    waitMock.mockRejectedValue(new Error('読めない'))

    await expect(measureDuration('blob:a')).rejects.toThrow('読めない')
  })

  it('失敗しても動画要素を破棄する', async () => {
    const video = offscreenVideo(0)
    createMock.mockReturnValue(video)
    waitMock.mockRejectedValue(new Error('読めない'))

    await expect(measureDuration('blob:a')).rejects.toThrow()
    expect(disposeMock).toHaveBeenCalledWith(video)
  })
})
