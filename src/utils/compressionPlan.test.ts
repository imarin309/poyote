import { describe, expect, it } from 'vitest'
import {
  buildCompressedFilename,
  buildPosterFilename,
  resolveEncoding,
  resolveOutputSize,
} from './compressionPlan'

describe('resolveOutputSize', () => {
  it('1080p以下の動画はそのままの大きさにする', () => {
    expect(resolveOutputSize({ width: 780, height: 720 })).toEqual({
      width: 780,
      height: 720,
    })
  })

  it('横長の4K動画は1920×1080に縮小する', () => {
    expect(resolveOutputSize({ width: 3840, height: 2160 })).toEqual({
      width: 1920,
      height: 1080,
    })
  })

  it('縦長の4K動画は1080×1920に縮小する', () => {
    expect(resolveOutputSize({ width: 2160, height: 3840 })).toEqual({
      width: 1080,
      height: 1920,
    })
  })

  it('短辺が上限を超える正方形の動画は短辺を1080にそろえる', () => {
    expect(resolveOutputSize({ width: 1440, height: 1440 })).toEqual({
      width: 1080,
      height: 1080,
    })
  })

  it('長辺だけが上限を超える横長の動画は長辺を1920にそろえる', () => {
    expect(resolveOutputSize({ width: 2560, height: 1080 })).toEqual({
      width: 1920,
      height: 810,
    })
  })

  it('縮小した結果が奇数になる場合は偶数に丸める', () => {
    expect(resolveOutputSize({ width: 3840, height: 1634 })).toEqual({
      width: 1920,
      height: 818,
    })
  })

  it('元の大きさが奇数でも偶数に丸める', () => {
    expect(resolveOutputSize({ width: 641, height: 481 })).toEqual({
      width: 642,
      height: 482,
    })
  })
})

describe('resolveEncoding', () => {
  const size = { width: 780, height: 720 }

  it('画質ごとにcrf相当の値を返す', () => {
    expect(resolveEncoding('high', size).quantizer).toBe(23)
    expect(resolveEncoding('standard', size).quantizer).toBe(26)
    expect(resolveEncoding('light', size).quantizer).toBe(28)
  })

  it('標準の予備ビットレートは実測の約1.1MB/36秒に近い', () => {
    expect(resolveEncoding('standard', size).bitrate).toBe(244296)
  })

  it('予備ビットレートは高画質ほど大きい', () => {
    const high = resolveEncoding('high', size).bitrate
    const standard = resolveEncoding('standard', size).bitrate
    const light = resolveEncoding('light', size).bitrate
    expect(high).toBeGreaterThan(standard)
    expect(standard).toBeGreaterThan(light)
  })

  it('予備ビットレートは画素数に比例する', () => {
    const small = resolveEncoding('standard', { width: 960, height: 540 })
    const large = resolveEncoding('standard', { width: 1920, height: 1080 })
    expect(large.bitrate).toBe(small.bitrate * 4)
  })
})

describe('buildCompressedFilename', () => {
  it('拡張子mp4を付ける', () => {
    expect(buildCompressedFilename('IMG_0001')).toBe('IMG_0001.mp4')
  })
})

describe('buildPosterFilename', () => {
  it('webpで生成できた場合は.webpにする', () => {
    expect(buildPosterFilename('IMG_0001', 'image/webp')).toBe(
      'IMG_0001-poster.webp',
    )
  })

  it('jpegにフォールバックした場合は.jpgにする', () => {
    expect(buildPosterFilename('IMG_0001', 'image/jpeg')).toBe(
      'IMG_0001-poster.jpg',
    )
  })
})
