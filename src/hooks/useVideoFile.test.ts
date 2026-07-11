import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVideoFile } from './useVideoFile'

describe('useVideoFile', () => {
  beforeEach(() => {
    let counter = 0
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => `blob:mock-${++counter}`),
        revokeObjectURL: vi.fn(),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('動画ファイルを読み込むとvideoが設定される', () => {
    const { result } = renderHook(() => useVideoFile())
    const file = new File([''], 'clip.mp4', { type: 'video/mp4' })

    act(() => {
      result.current.loadFile(file)
    })

    expect(result.current.video?.file).toBe(file)
    expect(result.current.error).toBeNull()
  })

  it('動画以外のファイルはエラーになりvideoは設定されない', () => {
    const { result } = renderHook(() => useVideoFile())
    const file = new File([''], 'photo.png', { type: 'image/png' })

    act(() => {
      result.current.loadFile(file)
    })

    expect(result.current.video).toBeNull()
    expect(result.current.error).not.toBeNull()
  })

  it('別の動画を読み込むと古いObject URLが解放される', () => {
    const { result } = renderHook(() => useVideoFile())
    const first = new File([''], 'a.mp4', { type: 'video/mp4' })
    const second = new File([''], 'b.mp4', { type: 'video/mp4' })

    act(() => {
      result.current.loadFile(first)
    })
    const firstUrl = result.current.video?.objectUrl

    act(() => {
      result.current.loadFile(second)
    })

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(firstUrl)
    expect(result.current.video?.file).toBe(second)
  })

  it('clearでvideoとerrorがリセットされる', () => {
    const { result } = renderHook(() => useVideoFile())
    const file = new File([''], 'clip.mp4', { type: 'video/mp4' })

    act(() => {
      result.current.loadFile(file)
    })
    act(() => {
      result.current.clear()
    })

    expect(result.current.video).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('reportPlaybackErrorでエラーが設定されvideoがクリアされる', () => {
    const { result } = renderHook(() => useVideoFile())
    const file = new File([''], 'clip.mov', { type: 'video/quicktime' })

    act(() => {
      result.current.loadFile(file)
    })
    act(() => {
      result.current.reportPlaybackError()
    })

    expect(result.current.video).toBeNull()
    expect(result.current.error).not.toBeNull()
  })
})
