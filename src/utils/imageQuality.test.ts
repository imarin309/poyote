import { describe, expect, it } from 'vitest'
import { buildQualitySteps, INITIAL_QUALITY, MIN_QUALITY } from './imageQuality'

describe('buildQualitySteps', () => {
  it('初期品質から下限まで段階的に下げる', () => {
    expect(buildQualitySteps(0.85, 0.7, 0.05)).toEqual([0.85, 0.8, 0.75, 0.7])
  })

  it('浮動小数の誤差を丸めて刻む', () => {
    buildQualitySteps().forEach((quality) => {
      expect(Number.isInteger(Math.round(quality * 100))).toBe(true)
      expect(quality).toBe(Math.round(quality * 100) / 100)
    })
  })

  it('既定値は初期品質で始まり下限を下回らない', () => {
    const steps = buildQualitySteps()
    expect(steps[0]).toBe(INITIAL_QUALITY)
    expect(steps[steps.length - 1]).toBeGreaterThanOrEqual(MIN_QUALITY)
    expect(steps[steps.length - 1] - MIN_QUALITY).toBeLessThan(0.05)
  })

  it('刻み幅が0以下の場合は初期品質のみ返す', () => {
    expect(buildQualitySteps(0.85, 0.3, 0)).toEqual([0.85])
  })

  it('初期品質が下限を下回る場合は初期品質のみ返す', () => {
    expect(buildQualitySteps(0.2, 0.3, 0.05)).toEqual([0.2])
  })
})
