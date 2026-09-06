import {
  createOffscreenVideo,
  disposeOffscreenVideo,
  waitForMetadata,
} from './offscreenVideo'

// 長さが取れないだけの動画（duration が非有限）と、そもそも読めない動画は
// 区別する。前者は再生できるので、リストから外してはいけない
export async function measureDuration(
  objectUrl: string,
): Promise<number | null> {
  const video = createOffscreenVideo(objectUrl)

  try {
    await waitForMetadata(video)
    const { duration } = video
    return Number.isFinite(duration) && duration > 0 ? duration : null
  } finally {
    disposeOffscreenVideo(video)
  }
}
