import { describe, expect, it } from 'vitest'
import {
  buildThumbnailTimes,
  MAX_THUMBNAIL_COUNT,
  resolveThumbnailInterval,
} from './thumbnailPlan'

describe('resolveThumbnailInterval', () => {
  it('上限枚数内であれば基本間隔をそのまま使う', () => {
    expect(resolveThumbnailInterval(35, 10, 360)).toBe(10)
  })

  it('上限枚数を超える長さの場合は間隔を広げる', () => {
    const duration = 4000
    const interval = resolveThumbnailInterval(duration, 10, 360)
    expect(interval).toBeCloseTo(4000 / 359)
  })

  it('duration が0以下の場合は基本間隔を返す', () => {
    expect(resolveThumbnailInterval(0, 10, 360)).toBe(10)
  })
})

describe('buildThumbnailTimes', () => {
  it('先頭から一定間隔の時刻配列を作る', () => {
    expect(buildThumbnailTimes(35, 10)).toEqual([0, 10, 20, 30])
  })

  it('ちょうど割り切れる場合も先頭からの間隔で作る', () => {
    expect(buildThumbnailTimes(30, 10)).toEqual([0, 10, 20, 30])
  })

  it('duration が0の場合は[0]を返す', () => {
    expect(buildThumbnailTimes(0, 10)).toEqual([0])
  })

  it('生成される枚数は上限を超えない', () => {
    const duration = 4000
    const interval = resolveThumbnailInterval(duration)
    const times = buildThumbnailTimes(duration, interval)
    expect(times.length).toBeLessThanOrEqual(MAX_THUMBNAIL_COUNT)
  })
})
