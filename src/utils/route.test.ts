import { describe, expect, it } from 'vitest'
import { pathForRoute, routeFromPath } from './route'

describe('routeFromPath', () => {
  it('ルートパスは動画ページ', () => {
    expect(routeFromPath('/')).toBe('video')
  })

  it('/image は画像ページ', () => {
    expect(routeFromPath('/image')).toBe('image')
  })

  it('末尾スラッシュがあっても同じページとして扱う', () => {
    expect(routeFromPath('/image/')).toBe('image')
  })

  it('未知のパスは動画ページにフォールバックする', () => {
    expect(routeFromPath('/unknown')).toBe('video')
  })
})

describe('pathForRoute', () => {
  it('動画ページのパスを返す', () => {
    expect(pathForRoute('video')).toBe('/')
  })

  it('画像ページのパスを返す', () => {
    expect(pathForRoute('image')).toBe('/image')
  })
})
