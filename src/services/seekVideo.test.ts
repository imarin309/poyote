import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { seekAndWait } from './seekVideo'

function createVideoStub() {
  const listeners: Record<string, EventListener[]> = {}
  return {
    currentTime: 0,
    addEventListener: (type: string, callback: EventListener) => {
      listeners[type] = [...(listeners[type] ?? []), callback]
    },
    removeEventListener: (type: string, callback: EventListener) => {
      listeners[type] = (listeners[type] ?? []).filter((l) => l !== callback)
    },
    dispatch: (type: string) => {
      ;(listeners[type] ?? []).forEach((callback) => callback(new Event(type)))
    },
  }
}

describe('seekAndWait', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('目的の時刻にシークし、seekedイベントで解決する', async () => {
    const video = createVideoStub()

    const promise = seekAndWait(video as unknown as HTMLVideoElement, 5)

    expect(video.currentTime).toBe(5)
    video.dispatch('seeked')

    await expect(promise).resolves.toBeUndefined()
  })

  it('seekedが発火しなくてもタイムアウトで解決する', async () => {
    const video = createVideoStub()

    const promise = seekAndWait(video as unknown as HTMLVideoElement, 5)
    await vi.advanceTimersByTimeAsync(2000)

    await expect(promise).resolves.toBeUndefined()
  })

  it('タイムアウト後にseekedが発火しても二重解決しない', async () => {
    const video = createVideoStub()

    const promise = seekAndWait(video as unknown as HTMLVideoElement, 5)
    await vi.advanceTimersByTimeAsync(2000)
    video.dispatch('seeked')

    await expect(promise).resolves.toBeUndefined()
  })
})
