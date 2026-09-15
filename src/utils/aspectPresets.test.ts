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

  it('「そのまま」は切り取った範囲の画素数で書き出す', () => {
    expect(presetOutputSize(original, sourceRect)).toEqual({
      width: 1500,
      height: 2000,
    })
  })
})
