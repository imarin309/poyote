import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVideoDurations } from './useVideoDurations'
import { measureDuration } from '../services/measureDuration'
import type { LoadedVideo } from '../types/video'

vi.mock('../services/measureDuration', () => ({
  measureDuration: vi.fn(),
}))

const measureMock = vi.mocked(measureDuration)

function loadedVideo(name: string): LoadedVideo {
  return {
    file: new File([''], name, { type: 'video/mp4' }),
    objectUrl: `blob:${name}`,
  }
}

function deferred() {
  let resolve: (value: number | null) => void = () => {}
  const promise = new Promise<number | null>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

describe('useVideoDurations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1本測るごとに合計と計測済み件数を更新する', async () => {
    const first = deferred()
    const second = deferred()
    measureMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const videos = [loadedVideo('a.mp4'), loadedVideo('b.mp4')]
    const { result } = renderHook(() => useVideoDurations(videos))

    await act(async () => {
      first.resolve(10)
      await first.promise
    })

    expect(result.current.totalDuration).toBe(10)
    expect(result.current.measuredCount).toBe(1)
    expect(result.current.isMeasuring).toBe(true)

    await act(async () => {
      second.resolve(5)
      await second.promise
    })

    expect(result.current.totalDuration).toBe(15)
    expect(result.current.measuredCount).toBe(2)
    expect(result.current.isMeasuring).toBe(false)
  })

  it('並列にせず1本ずつ測る', async () => {
    let running = 0
    let maxRunning = 0
    measureMock.mockImplementation(async () => {
      running += 1
      maxRunning = Math.max(maxRunning, running)
      await Promise.resolve()
      running -= 1
      return 1
    })

    const videos = [
      loadedVideo('a.mp4'),
      loadedVideo('b.mp4'),
      loadedVideo('c.mp4'),
    ]
    const { result } = renderHook(() => useVideoDurations(videos))

    await waitFor(() => expect(result.current.isMeasuring).toBe(false))
    expect(maxRunning).toBe(1)
  })

  it('計測中に読み込み直しても、前の1本が終わるまで次を測らない', async () => {
    let running = 0
    let maxRunning = 0
    const finishers: Array<() => void> = []
    measureMock.mockImplementation(() => {
      running += 1
      maxRunning = Math.max(maxRunning, running)
      return new Promise((resolve) => {
        finishers.push(() => {
          running -= 1
          resolve(1)
        })
      })
    })

    const { result, rerender } = renderHook(
      ({ videos }: { videos: LoadedVideo[] }) => useVideoDurations(videos),
      { initialProps: { videos: [loadedVideo('a.mp4')] } },
    )

    await waitFor(() => expect(measureMock).toHaveBeenCalledTimes(1))

    rerender({ videos: [loadedVideo('c.mp4')] })
    await act(async () => {
      await Promise.resolve()
    })
    expect(measureMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      finishers[0]()
    })
    await waitFor(() => expect(finishers).toHaveLength(2))

    await act(async () => {
      finishers[1]()
    })
    await waitFor(() => expect(result.current.isMeasuring).toBe(false))

    expect(maxRunning).toBe(1)
  })

  it('メタデータを読めなかった動画はerrorUrlsに入り、合計に加えない', async () => {
    measureMock
      .mockRejectedValueOnce(new Error('読めない'))
      .mockResolvedValueOnce(20)

    const videos = [loadedVideo('broken.mp4'), loadedVideo('b.mp4')]
    const { result } = renderHook(() => useVideoDurations(videos))

    await waitFor(() => expect(result.current.isMeasuring).toBe(false))

    expect(result.current.errorUrls.has('blob:broken.mp4')).toBe(true)
    expect(result.current.durations.has('blob:broken.mp4')).toBe(false)
    expect(result.current.totalDuration).toBe(20)
  })

  it('長さが不明な動画は計測済みとして数え、合計には加えない', async () => {
    measureMock.mockResolvedValueOnce(null).mockResolvedValueOnce(30)

    const videos = [loadedVideo('unknown.webm'), loadedVideo('b.mp4')]
    const { result } = renderHook(() => useVideoDurations(videos))

    await waitFor(() => expect(result.current.isMeasuring).toBe(false))

    expect(result.current.durations.get('blob:unknown.webm')).toBeNull()
    expect(result.current.errorUrls.size).toBe(0)
    expect(result.current.measuredCount).toBe(2)
    expect(result.current.totalDuration).toBe(30)
  })

  it('一度測った動画は測り直さない', async () => {
    measureMock.mockResolvedValue(10)

    const first = loadedVideo('a.mp4')
    const { result, rerender } = renderHook(
      ({ videos }: { videos: LoadedVideo[] }) => useVideoDurations(videos),
      { initialProps: { videos: [first] } },
    )

    await waitFor(() => expect(result.current.isMeasuring).toBe(false))

    rerender({ videos: [first, loadedVideo('b.mp4')] })
    await waitFor(() => expect(result.current.measuredCount).toBe(2))

    expect(measureMock).toHaveBeenCalledTimes(2)
    expect(measureMock).toHaveBeenNthCalledWith(1, 'blob:a.mp4')
    expect(measureMock).toHaveBeenNthCalledWith(2, 'blob:b.mp4')
  })
})
