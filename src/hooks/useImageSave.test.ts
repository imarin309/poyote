import { StrictMode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useImageSave } from './useImageSave'
import { downloadBlob } from '../services/downloadImage'

vi.mock('../services/downloadImage', () => ({
  downloadBlob: vi.fn(),
}))

const createBlob = () => Promise.resolve(new Blob([''], { type: 'image/jpeg' }))

function savedFilename(): string {
  return vi.mocked(downloadBlob).mock.calls[0][1]
}

describe('useImageSave', () => {
  beforeEach(() => {
    vi.mocked(downloadBlob).mockClear()
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => 'blob:mock'),
        revokeObjectURL: vi.fn(),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ベース名にjpgの拡張子を付けて保存する', async () => {
    const { result } = renderHook(() => useImageSave('photo'))

    await act(async () => {
      await result.current.save(createBlob)
    })

    expect(savedFilename()).toBe('photo.jpg')
    expect(result.current.lastSaved?.filename).toBe('photo.jpg')
  })

  it('ベース名が空の場合は既定名にフォールバックする', async () => {
    const { result } = renderHook(() => useImageSave(''))

    await act(async () => {
      await result.current.save(createBlob)
    })

    expect(savedFilename()).toBe('image.jpg')
  })

  it('ベース名が空白のみの場合も既定名にフォールバックする', async () => {
    const { result } = renderHook(() => useImageSave('   '))

    await act(async () => {
      await result.current.save(createBlob)
    })

    expect(savedFilename()).toBe('image.jpg')
  })

  it('保存のたびに古いプレビューURLを解放し、余分なURLを作らない', async () => {
    // StrictModeはsetStateの更新関数を2回呼ぶ。その中でObject URLを作ると
    // 捨てられた方が解放されずに残るため、実際のアプリと同じ条件で確かめる
    const { result } = renderHook(() => useImageSave('photo'), {
      wrapper: StrictMode,
    })

    await act(async () => {
      await result.current.save(createBlob)
    })
    const first = result.current.lastSaved?.objectUrl

    await act(async () => {
      await result.current.save(createBlob)
    })

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(first)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2)
  })

  it('同時に呼ばれても保存は1回だけ走る', async () => {
    const { result } = renderHook(() => useImageSave('photo'))

    let second = true
    await act(async () => {
      const first = result.current.save(createBlob)
      second = await result.current.save(createBlob)
      await first
    })

    expect(second).toBe(false)
    expect(downloadBlob).toHaveBeenCalledTimes(1)
  })

  it('保存に失敗するとエラーを持ちfalseを返す', async () => {
    const { result } = renderHook(() => useImageSave('photo'))

    let saved = true
    await act(async () => {
      saved = await result.current.save(() =>
        Promise.reject(new Error('画像を読み込めませんでした。')),
      )
    })

    expect(saved).toBe(false)
    expect(result.current.error).toBe('画像を読み込めませんでした。')
    expect(downloadBlob).not.toHaveBeenCalled()
  })
})
