import { describe, expect, it } from 'vitest'
import { formatDuration, formatTimeForFilename } from './formatTime'

describe('formatDuration', () => {
  it('60秒未満はmm:ssで表示する', () => {
    expect(formatDuration(5)).toBe('00:05')
  })

  it('分秒を正しくパディングする', () => {
    expect(formatDuration(75)).toBe('01:15')
  })

  it('1時間以上はh:mm:ssで表示する', () => {
    expect(formatDuration(3661)).toBe('1:01:01')
  })

  it('負の値は00:00にする', () => {
    expect(formatDuration(-5)).toBe('00:00')
  })

  it('NaNは00:00にする', () => {
    expect(formatDuration(NaN)).toBe('00:00')
  })
})

describe('formatTimeForFilename', () => {
  it('分・秒・ミリ秒をファイル名向けの形式にする', () => {
    expect(formatTimeForFilename(12.35)).toBe('00-12-350')
  })

  it('1分以上も正しくパディングする', () => {
    expect(formatTimeForFilename(75.001)).toBe('01-15-001')
  })

  it('負の値は00-00-000にする', () => {
    expect(formatTimeForFilename(-1)).toBe('00-00-000')
  })

  it('NaNは00-00-000にする', () => {
    expect(formatTimeForFilename(NaN)).toBe('00-00-000')
  })
})
