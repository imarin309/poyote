import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useImageQueue } from './useImageQueue'
import type { LoadedImage } from '../types/image'

function imageFile(name: string) {
  return new File([''], name, { type: 'image/png' })
}

describe('useImageQueue', () => {
  beforeEach(() => {
    let counter = 0
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => `blob:mock-${counter++}`),
        revokeObjectURL: vi.fn(),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('複数の画像を読み込んで先頭を返す', () => {
    const { result } = renderHook(() => useImageQueue())
    const files = [imageFile('a.png'), imageFile('b.png')]

    const loaded: { value: LoadedImage | null } = { value: null }
    act(() => {
      loaded.value = result.current.load(files)
    })

    expect(loaded.value?.file).toBe(files[0])
    expect(result.current.total).toBe(2)
    expect(result.current.index).toBe(0)
    expect(result.current.current?.file).toBe(files[0])
  })

  it('画像以外を除外して読み込み、除外を警告する', () => {
    const { result } = renderHook(() => useImageQueue())
    const png = imageFile('a.png')
    const mp4 = new File([''], 'clip.mp4', { type: 'video/mp4' })

    act(() => {
      result.current.load([png, mp4])
    })

    expect(result.current.total).toBe(1)
    expect(result.current.error).toBe('画像でないファイル1件を除外しました。')
  })

  it('画像が1件もなければエラーにしてnullを返す', () => {
    const { result } = renderHook(() => useImageQueue())

    const loaded: { value: LoadedImage | null } = { value: null }
    act(() => {
      loaded.value = result.current.load([
        new File([''], 'clip.mp4', { type: 'video/mp4' }),
      ])
    })

    expect(loaded.value).toBeNull()
    expect(result.current.total).toBe(0)
    expect(result.current.error).toBe('画像ファイルを選択してください。')
  })

  // setStateの更新関数の中から次を取り出すと同期実行されないため常にnullになる
  it('advanceは次の画像をその場で返し、保存件数を数える', () => {
    const { result } = renderHook(() => useImageQueue())
    const files = [imageFile('a.png'), imageFile('b.png')]

    act(() => {
      result.current.load(files)
    })

    const advanced: { value: LoadedImage | null } = { value: null }
    act(() => {
      advanced.value = result.current.advance(true)
    })

    expect(advanced.value?.file).toBe(files[1])
    expect(result.current.index).toBe(1)
    expect(result.current.savedCount).toBe(1)
    expect(result.current.isFinished).toBe(false)
  })

  it('スキップはskippedCountを数える', () => {
    const { result } = renderHook(() => useImageQueue())

    act(() => {
      result.current.load([imageFile('a.png'), imageFile('b.png')])
    })
    act(() => {
      result.current.advance(false)
    })

    expect(result.current.savedCount).toBe(0)
    expect(result.current.skippedCount).toBe(1)
  })

  it('最後まで進むとnullを返して完了状態になる', () => {
    const { result } = renderHook(() => useImageQueue())

    act(() => {
      result.current.load([imageFile('a.png')])
    })

    const advanced: { value: LoadedImage | null } = { value: null }
    act(() => {
      advanced.value = result.current.advance(true)
    })

    expect(advanced.value).toBeNull()
    expect(result.current.current).toBeNull()
    expect(result.current.isFinished).toBe(true)
    expect(result.current.savedCount).toBe(1)
  })

  it('読み込み直しで前のObject URLをすべて解放する', () => {
    const { result } = renderHook(() => useImageQueue())

    act(() => {
      result.current.load([imageFile('a.png'), imageFile('b.png')])
    })
    const urls = result.current.images.map((image) => image.objectUrl)

    act(() => {
      result.current.load([imageFile('c.png')])
    })

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(urls[0])
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(urls[1])
    expect(result.current.total).toBe(1)
  })

  it('clearでキューを破棄してObject URLを解放する', () => {
    const { result } = renderHook(() => useImageQueue())

    act(() => {
      result.current.load([imageFile('a.png')])
    })
    const objectUrl = result.current.current?.objectUrl

    act(() => {
      result.current.clear()
    })

    expect(result.current.total).toBe(0)
    expect(result.current.current).toBeNull()
    expect(result.current.isFinished).toBe(false)
    expect(result.current.error).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(objectUrl)
  })

  it('アンマウント時にObject URLを解放する', () => {
    const { result, unmount } = renderHook(() => useImageQueue())

    act(() => {
      result.current.load([imageFile('a.png')])
    })
    const objectUrl = result.current.current?.objectUrl

    unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(objectUrl)
  })
})

describe('useImageQueue の中止と再開', () => {
  beforeEach(() => {
    let counter = 0
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => `blob:mock-${counter++}`),
        revokeObjectURL: vi.fn(),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('cancelはトリミングの回を終わらせるが画像は残す', () => {
    const { result } = renderHook(() => useImageQueue())

    act(() => {
      result.current.load([imageFile('a.png'), imageFile('b.png')])
    })
    act(() => {
      result.current.advance(true)
    })
    act(() => {
      result.current.cancel()
    })

    expect(result.current.isFinished).toBe(true)
    expect(result.current.current).toBeNull()
    expect(result.current.total).toBe(2)
    expect(result.current.images).toHaveLength(2)
    expect(result.current.savedCount).toBe(1)
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })

  it('restartは画像を保持したまま進行状況だけ戻す', () => {
    const { result } = renderHook(() => useImageQueue())

    act(() => {
      result.current.load([imageFile('a.png'), imageFile('b.png')])
    })
    act(() => {
      result.current.advance(true)
    })
    act(() => {
      result.current.restart()
    })

    expect(result.current.total).toBe(2)
    expect(result.current.index).toBe(0)
    expect(result.current.savedCount).toBe(0)
    expect(result.current.skippedCount).toBe(0)
    expect(result.current.current?.file.name).toBe('a.png')
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })

  it('完了後にrestartすると再開できる状態に戻る', () => {
    const { result } = renderHook(() => useImageQueue())

    act(() => {
      result.current.load([imageFile('a.png')])
    })
    act(() => {
      result.current.advance(true)
    })
    expect(result.current.isFinished).toBe(true)

    act(() => {
      result.current.restart()
    })

    expect(result.current.isFinished).toBe(false)
    expect(result.current.current?.file.name).toBe('a.png')
  })
})
