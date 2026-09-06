import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVideoFiles } from './useVideoFiles'

function videoFile(name: string) {
  return new File([''], name, { type: 'video/mp4' })
}

describe('useVideoFiles', () => {
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

  it('複数の動画を読み込むと順番に並び、先頭が選択される', () => {
    const { result } = renderHook(() => useVideoFiles())
    const files = [videoFile('a.mp4'), videoFile('b.mp4')]

    act(() => {
      result.current.load(files)
    })

    expect(result.current.videos).toHaveLength(2)
    expect(result.current.total).toBe(2)
    expect(result.current.index).toBe(0)
    expect(result.current.current?.file).toBe(files[0])
    expect(result.current.error).toBeNull()
  })

  it('動画でないファイルは除外され、除外した件数を警告する', () => {
    const { result } = renderHook(() => useVideoFiles())
    const video = videoFile('clip.mp4')

    act(() => {
      result.current.load([
        video,
        new File([''], 'photo.png', { type: 'image/png' }),
      ])
    })

    expect(result.current.videos).toHaveLength(1)
    expect(result.current.current?.file).toBe(video)
    expect(result.current.error).toBe('動画でないファイル1件を除外しました。')
  })

  it('動画が1件も無いとエラーになり、videosは空のまま', () => {
    const { result } = renderHook(() => useVideoFiles())

    act(() => {
      result.current.load([new File([''], 'photo.png', { type: 'image/png' })])
    })

    expect(result.current.videos).toHaveLength(0)
    expect(result.current.current).toBeNull()
    expect(result.current.error).toBe('動画ファイルを選択してください。')
  })

  it('読み込み直すと古いObject URLがすべて解放される', () => {
    const { result } = renderHook(() => useVideoFiles())

    act(() => {
      result.current.load([videoFile('a.mp4'), videoFile('b.mp4')])
    })
    const oldUrls = result.current.videos.map((video) => video.objectUrl)

    act(() => {
      result.current.load([videoFile('c.mp4')])
    })

    oldUrls.forEach((url) =>
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(url),
    )
    expect(result.current.videos).toHaveLength(1)
  })

  it('selectで選択中の動画が切り替わる', () => {
    const { result } = renderHook(() => useVideoFiles())
    const files = [videoFile('a.mp4'), videoFile('b.mp4')]

    act(() => {
      result.current.load(files)
    })
    act(() => {
      result.current.select(1)
    })

    expect(result.current.index).toBe(1)
    expect(result.current.current?.file).toBe(files[1])
  })

  it('selectは範囲外の値を端にクランプする', () => {
    const { result } = renderHook(() => useVideoFiles())

    act(() => {
      result.current.load([videoFile('a.mp4'), videoFile('b.mp4')])
    })

    act(() => {
      result.current.select(9)
    })
    expect(result.current.index).toBe(1)

    act(() => {
      result.current.select(-1)
    })
    expect(result.current.index).toBe(0)
  })

  it('再生できない動画はリストに残したまま印が付く', () => {
    const { result } = renderHook(() => useVideoFiles())
    const files = [videoFile('broken.mp4'), videoFile('ok.mp4')]

    act(() => {
      result.current.load(files)
    })
    act(() => {
      result.current.reportPlaybackError()
    })

    expect(result.current.videos).toHaveLength(2)
    expect(result.current.isUnplayable(result.current.videos[0])).toBe(true)
    expect(result.current.isUnplayable(result.current.videos[1])).toBe(false)
    expect(result.current.error).toBe('broken.mp4 はブラウザで再生できません。')
  })

  it('再生できない動画から切り替えるとエラー表示が消える', () => {
    const { result } = renderHook(() => useVideoFiles())

    act(() => {
      result.current.load([videoFile('broken.mp4'), videoFile('ok.mp4')])
    })
    act(() => {
      result.current.reportPlaybackError()
    })
    act(() => {
      result.current.select(1)
    })

    expect(result.current.error).toBeNull()
  })

  it('clearで動画とエラーがリセットされる', () => {
    const { result } = renderHook(() => useVideoFiles())

    act(() => {
      result.current.load([videoFile('a.mp4')])
    })
    act(() => {
      result.current.clear()
    })

    expect(result.current.videos).toHaveLength(0)
    expect(result.current.current).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
