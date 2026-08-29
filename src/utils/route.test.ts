import { describe, expect, it } from 'vitest'
import { pathForRoute, routeFromPath } from './route'

describe('routeFromPath', () => {
  it('ルートパスはトップページ', () => {
    expect(routeFromPath('/')).toBe('top')
  })

  it('/movie は動画ページ', () => {
    expect(routeFromPath('/movie')).toBe('video')
  })

  it('/image は画像ページ', () => {
    expect(routeFromPath('/image')).toBe('image')
  })

  it('末尾スラッシュがあっても同じページとして扱う', () => {
    expect(routeFromPath('/image/')).toBe('image')
  })

  it('未知のパスはトップページにフォールバックする', () => {
    expect(routeFromPath('/unknown')).toBe('top')
  })
})

describe('pathForRoute', () => {
  it('トップページのパスを返す', () => {
    expect(pathForRoute('top')).toBe('/')
  })

  it('動画ページのパスを返す', () => {
    expect(pathForRoute('video')).toBe('/movie')
  })

  it('画像ページのパスを返す', () => {
    expect(pathForRoute('image')).toBe('/image')
  })
})
