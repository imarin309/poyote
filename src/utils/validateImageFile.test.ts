import { describe, expect, it } from 'vitest'
import { isImageFile } from './validateImageFile'

describe('isImageFile', () => {
  it('画像ファイルはtrueを返す', () => {
    const file = new File([''], 'photo.png', { type: 'image/png' })
    expect(isImageFile(file)).toBe(true)
  })

  it('動画ファイルはfalseを返す', () => {
    const file = new File([''], 'clip.mp4', { type: 'video/mp4' })
    expect(isImageFile(file)).toBe(false)
  })

  it('MIMEタイプが空のファイルはfalseを返す', () => {
    const file = new File([''], 'unknown.bin', { type: '' })
    expect(isImageFile(file)).toBe(false)
  })
})
