import { describe, expect, it } from 'vitest'
import { clampTime } from './clampTime'

describe('clampTime', () => {
  it('範囲内の値はそのまま返す', () => {
    expect(clampTime(5, 10)).toBe(5)
  })

  it('0未満は0にする', () => {
    expect(clampTime(-3, 10)).toBe(0)
  })

  it('durationを超える値はdurationにする', () => {
    expect(clampTime(15, 10)).toBe(10)
  })

  it('durationが0の場合は0を返す', () => {
    expect(clampTime(5, 0)).toBe(0)
  })

  it('durationがNaNの場合は0を返す', () => {
    expect(clampTime(5, NaN)).toBe(0)
  })
})
