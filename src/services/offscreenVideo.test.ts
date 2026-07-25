import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createOffscreenVideo,
  disposeOffscreenVideo,
  waitForMetadata,
} from './offscreenVideo'

describe('createOffscreenVideo', () => {
  it('srcを設定し、mutedなvideo要素を作る', () => {
    const video = createOffscreenVideo('blob:mock-url')

    expect(video.src).toContain('blob:mock-url')
    expect(video.muted).toBe(true)
    expect(video.preload).toBe('metadata')
  })
})

describe('waitForMetadata', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('既にメタデータが読み込まれていれば即解決する', async () => {
    const video = createOffscreenVideo('blob:mock-url')
    vi.spyOn(video, 'readyState', 'get').mockReturnValue(video.HAVE_METADATA)

    await expect(waitForMetadata(video)).resolves.toBeUndefined()
  })

  it('loadedmetadataイベントで解決する', async () => {
    const video = createOffscreenVideo('blob:mock-url')

    const promise = waitForMetadata(video)
    video.dispatchEvent(new Event('loadedmetadata'))

    await expect(promise).resolves.toBeUndefined()
  })

  it('errorイベントで例外になる', async () => {
    const video = createOffscreenVideo('blob:mock-url')

    const promise = waitForMetadata(video)
    video.dispatchEvent(new Event('error'))

    await expect(promise).rejects.toThrow(
      '動画のメタデータ読み込みに失敗しました。',
    )
  })
})

describe('disposeOffscreenVideo', () => {
  it('再生を止め、srcを外してload()し直す', () => {
    const video = createOffscreenVideo('blob:mock-url')
    const pauseSpy = vi.spyOn(video, 'pause').mockImplementation(() => {})
    const loadSpy = vi.spyOn(video, 'load').mockImplementation(() => {})

    disposeOffscreenVideo(video)

    expect(pauseSpy).toHaveBeenCalledTimes(1)
    expect(video.hasAttribute('src')).toBe(false)
    expect(loadSpy).toHaveBeenCalledTimes(1)
  })
})
