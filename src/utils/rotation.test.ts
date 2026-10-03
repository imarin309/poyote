import { describe, expect, it } from 'vitest'
import { nextRotation, rotatedSize } from './rotation'

describe('nextRotation', () => {
  it('右に回すと時計回りに90度進む', () => {
    expect(nextRotation(0, 'right')).toBe(90)
    expect(nextRotation(90, 'right')).toBe(180)
    expect(nextRotation(180, 'right')).toBe(270)
  })

  it('右に1周すると0度に戻る', () => {
    expect(nextRotation(270, 'right')).toBe(0)
  })

  it('左に回すと反時計回りに90度戻る', () => {
    expect(nextRotation(270, 'left')).toBe(180)
    expect(nextRotation(180, 'left')).toBe(90)
    expect(nextRotation(90, 'left')).toBe(0)
  })

  it('0度から左に回すと270度になる', () => {
    expect(nextRotation(0, 'left')).toBe(270)
  })
})

describe('rotatedSize', () => {
  const size = { width: 800, height: 450 }

  it('90度・270度では縦横を入れ替える', () => {
    expect(rotatedSize(size, 90)).toEqual({ width: 450, height: 800 })
    expect(rotatedSize(size, 270)).toEqual({ width: 450, height: 800 })
  })

  it('0度・180度では縦横を変えない', () => {
    expect(rotatedSize(size, 0)).toEqual(size)
    expect(rotatedSize(size, 180)).toEqual(size)
  })
})
