import { describe, expect, it } from 'vitest'
import { formatDuration } from './formatTime'

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
