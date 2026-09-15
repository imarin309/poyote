import { describe, expect, it } from 'vitest'
import { presetOutputSize, presetRatio } from './aspectPresets'
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

  it('「そのまま」は長辺が1200pxに満たない切り取りを拡大する', () => {
    expect(
      presetOutputSize(original, { left: 0, top: 0, width: 600, height: 400 }),
    ).toEqual({ width: 1200, height: 800 })
  })

  it('「そのまま」は範囲が空なら0を返す', () => {
    expect(
      presetOutputSize(original, { left: 0, top: 0, width: 0, height: 400 }),
    ).toEqual({ width: 0, height: 0 })
  })
})
