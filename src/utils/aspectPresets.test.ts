import { describe, expect, it } from 'vitest'
import { fitLongSide, presetOutputSize, presetRatio } from './aspectPresets'
import type { AspectPreset } from './aspectPresets'

const fixed: AspectPreset = {
  kind: 'fixed',
  label: '横長 16:9',
  width: 1200,
  height: 675,
}
const original: AspectPreset = { kind: 'original', label: 'そのまま' }

const sourceSize = { width: 3000, height: 4000 }
const sourceRect = { left: 100, top: 200, width: 1500, height: 2000 }

describe('presetRatio', () => {
  it('固定サイズのプリセットは元画像によらずプリセットの比率になる', () => {
    expect(presetRatio(fixed, sourceSize)).toBeCloseTo(1200 / 675)
  })

  it('「そのまま」は元画像の比率になる', () => {
    expect(presetRatio(original, sourceSize)).toBeCloseTo(3000 / 4000)
  })
})

describe('presetOutputSize', () => {
  it('固定サイズのプリセットはプリセットのサイズで書き出す', () => {
    expect(presetOutputSize(fixed, sourceRect)).toEqual({
      width: 1200,
      height: 675,
    })
  })

  it('「そのまま」は切り取った範囲の比率のまま長辺を1200pxに縮める', () => {
    expect(presetOutputSize(original, sourceRect)).toEqual({
      width: 900,
      height: 1200,
    })
  })
})

describe('fitLongSide', () => {
  it('横長の画像は幅を1200pxにして比率を保つ', () => {
    expect(fitLongSide({ width: 4000, height: 3000 })).toEqual({
      width: 1200,
      height: 900,
    })
  })

  it('長辺が1200pxに満たない画像は拡大する', () => {
    expect(fitLongSide({ width: 600, height: 400 })).toEqual({
      width: 1200,
      height: 800,
    })
  })

  it('端数は四捨五入する', () => {
    expect(fitLongSide({ width: 3000, height: 1001 })).toEqual({
      width: 1200,
      height: 400,
    })
  })

  it('サイズが0なら0を返す', () => {
    expect(fitLongSide({ width: 0, height: 400 })).toEqual({
      width: 0,
      height: 0,
    })
  })
})
