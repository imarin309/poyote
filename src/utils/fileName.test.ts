import { describe, expect, it } from 'vitest'
import { buildCaptureFilename, stripExtension } from './fileName'

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
  it('ベース名と時刻からWebPファイル名を生成する', () => {
    expect(buildCaptureFilename('clip', 12.35)).toBe('clip-00-12-350.webp')
  })
})
