import { describe, expect, it } from 'vitest'
import { isVideoFile } from './validateVideoFile'

describe('isVideoFile', () => {
  it('動画ファイルはtrueを返す', () => {
    const file = new File([''], 'clip.mp4', { type: 'video/mp4' })
    expect(isVideoFile(file)).toBe(true)
  })

  it('画像ファイルはfalseを返す', () => {
    const file = new File([''], 'photo.png', { type: 'image/png' })
    expect(isVideoFile(file)).toBe(false)
  })

  it('MIMEタイプが空のファイルはfalseを返す', () => {
    const file = new File([''], 'unknown.bin', { type: '' })
    expect(isVideoFile(file)).toBe(false)
  })
})
