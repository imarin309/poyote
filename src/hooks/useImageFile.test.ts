import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useImageFile } from './useImageFile'

describe('useImageFile', () => {
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

  it('画像ファイルを読み込むとimageが設定される', () => {
    const { result } = renderHook(() => useImageFile())
    const file = new File([''], 'photo.png', { type: 'image/png' })

    act(() => {
      result.current.loadFile(file)
    })

    expect(result.current.image?.file).toBe(file)
    expect(result.current.error).toBeNull()
  })

  it('画像以外のファイルはエラーになりimageは設定されない', () => {
    const { result } = renderHook(() => useImageFile())
    const file = new File([''], 'clip.mp4', { type: 'video/mp4' })

    act(() => {
      result.current.loadFile(file)
    })

    expect(result.current.image).toBeNull()
    expect(result.current.error).not.toBeNull()
  })

  it('別の画像を読み込むと古いObject URLが解放される', () => {
    const { result } = renderHook(() => useImageFile())
    const first = new File([''], 'a.png', { type: 'image/png' })
    const second = new File([''], 'b.png', { type: 'image/png' })

    act(() => {
      result.current.loadFile(first)
    })
    const firstUrl = result.current.image?.objectUrl

    act(() => {
      result.current.loadFile(second)
    })

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(firstUrl)
    expect(result.current.image?.file).toBe(second)
  })

  it('clearでimageとerrorがリセットされる', () => {
    const { result } = renderHook(() => useImageFile())
    const file = new File([''], 'photo.png', { type: 'image/png' })

    act(() => {
      result.current.loadFile(file)
    })
    act(() => {
      result.current.clear()
    })

    expect(result.current.image).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('アンマウント時にObject URLを解放する', () => {
    const { result, unmount } = renderHook(() => useImageFile())
    const file = new File([''], 'photo.png', { type: 'image/png' })

    act(() => {
      result.current.loadFile(file)
    })
    const objectUrl = result.current.image?.objectUrl

    unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(objectUrl)
  })
})
