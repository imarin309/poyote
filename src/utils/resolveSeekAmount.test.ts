import { describe, expect, it } from 'vitest'
import { resolveSeekAmount } from './resolveSeekAmount'

describe('resolveSeekAmount', () => {
  it('ArrowLeftは-1秒を返す', () => {
    expect(resolveSeekAmount('ArrowLeft', { shift: false, alt: false })).toBe(
      -1,
    )
  })

  it('ArrowRightは+1秒を返す', () => {
    expect(resolveSeekAmount('ArrowRight', { shift: false, alt: false })).toBe(
      1,
    )
  })

  it('Shift+ArrowLeftは-0.1秒を返す', () => {
    expect(resolveSeekAmount('ArrowLeft', { shift: true, alt: false })).toBe(
      -0.1,
    )
  })

  it('Shift+ArrowRightは+0.1秒を返す', () => {
    expect(resolveSeekAmount('ArrowRight', { shift: true, alt: false })).toBe(
      0.1,
    )
  })

  it('Alt+ArrowLeftは-10秒を返す', () => {
    expect(resolveSeekAmount('ArrowLeft', { shift: false, alt: true })).toBe(
      -10,
    )
  })

  it('Alt+ArrowRightは+10秒を返す', () => {
    expect(resolveSeekAmount('ArrowRight', { shift: false, alt: true })).toBe(
      10,
    )
  })

  it('矢印キー以外はnullを返す', () => {
    expect(resolveSeekAmount('Space', { shift: false, alt: false })).toBeNull()
  })

  it('ShiftとAltが同時の場合はShiftを優先する', () => {
    expect(resolveSeekAmount('ArrowLeft', { shift: true, alt: true })).toBe(
      -0.1,
    )
  })
})
