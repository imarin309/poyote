import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useImageQueue } from './useImageQueue'
import type { LoadedImage } from '../types/image'

function imageFile(name: string) {
  return new File([''], name, { type: 'image/png' })
}

beforeEach(() => {
  vi.restoreAllMocks()
  let counter = 0
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:${counter++}`)
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

describe('useImageQueue', () => {
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

  it('画像以外を除外して読み込む', () => {
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

  it('advanceが次の画像を返し保存件数を数える', () => {
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
    act(() => {
      result.current.load([imageFile('c.png')])
    })

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:0')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1')
    expect(result.current.total).toBe(1)
  })

  it('clearでキューを破棄する', () => {
    const { result } = renderHook(() => useImageQueue())

    act(() => {
      result.current.load([imageFile('a.png')])
    })
    act(() => {
      result.current.clear()
    })

    expect(result.current.total).toBe(0)
    expect(result.current.current).toBeNull()
    expect(result.current.isFinished).toBe(false)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:0')
  })
})

describe('useImageQueue の restart', () => {
  it('画像を保持したまま進行状況だけ戻す', () => {
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

  it('Object URLは解放しない', () => {
    const { result } = renderHook(() => useImageQueue())

    act(() => {
      result.current.load([imageFile('a.png')])
    })
    act(() => {
      result.current.restart()
    })

    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })
})
