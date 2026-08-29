import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useRoute } from './useRoute'

afterEach(() => {
  window.history.pushState(null, '', '/')
})

describe('useRoute', () => {
  it('現在のURLから初期ページを決める', () => {
    window.history.pushState(null, '', '/image')
    const { result } = renderHook(() => useRoute())
    expect(result.current.route).toBe('image')
  })

  it('未知のパスはトップページになる', () => {
    window.history.pushState(null, '', '/unknown')
    const { result } = renderHook(() => useRoute())
    expect(result.current.route).toBe('top')
  })

  it('navigateでURLと状態の両方が変わる', () => {
    const { result } = renderHook(() => useRoute())

    act(() => {
      result.current.navigate('video')
    })

    expect(result.current.route).toBe('video')
    expect(window.location.pathname).toBe('/movie')
  })

  it('戻る操作に追従する', () => {
    const { result } = renderHook(() => useRoute())

    act(() => {
      result.current.navigate('image')
    })
    expect(result.current.route).toBe('image')

    act(() => {
      window.history.pushState(null, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(result.current.route).toBe('top')
  })
})
