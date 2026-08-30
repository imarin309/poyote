import { describe, expect, it } from 'vitest'
import {
  buildCaptureFilename,
  buildImageFilename,
  extensionForMimeType,
  stripExtension,
} from './fileName'

describe('stripExtension', () => {
  it('拡張子を取り除く', () => {
    expect(stripExtension('clip.mp4')).toBe('clip')
  })

  it('複数のドットがある場合は最後の拡張子だけ取り除く', () => {
    expect(stripExtension('my.video.file.mp4')).toBe('my.video.file')
  })

  it('拡張子がない場合はそのまま返す', () => {
    expect(stripExtension('clip')).toBe('clip')
  })

  it('先頭がドットの隠しファイル名はそのまま返す', () => {
    expect(stripExtension('.gitignore')).toBe('.gitignore')
  })
})

describe('buildCaptureFilename', () => {
  it('ベース名をそのままJPEGファイル名にする', () => {
    expect(buildCaptureFilename('clip')).toBe('clip.jpg')
  })
})

describe('extensionForMimeType', () => {
  it('webpはwebpを返す', () => {
    expect(extensionForMimeType('image/webp')).toBe('webp')
  })

  it('jpegはjpgを返す', () => {
    expect(extensionForMimeType('image/jpeg')).toBe('jpg')
  })

  it('未知の形式はbinを返す', () => {
    expect(extensionForMimeType('application/octet-stream')).toBe('bin')
  })
})

describe('buildImageFilename', () => {
  it('webpならwebp拡張子にする', () => {
    expect(buildImageFilename('photo', 'image/webp')).toBe('photo.webp')
  })

  it('jpegにフォールバックした場合はjpg拡張子にする', () => {
    expect(buildImageFilename('photo', 'image/jpeg')).toBe('photo.jpg')
  })
})
