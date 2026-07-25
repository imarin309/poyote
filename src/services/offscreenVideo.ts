export function createOffscreenVideo(src: string): HTMLVideoElement {
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.muted = true
  video.src = src
  return video
}

const METADATA_TIMEOUT_MS = 10000

export function waitForMetadata(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= video.HAVE_METADATA) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', handleLoaded)
      video.removeEventListener('error', handleError)
      clearTimeout(timer)
    }
    const handleLoaded = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error('動画のメタデータ読み込みに失敗しました。'))
    }
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('動画のメタデータ読み込みがタイムアウトしました。'))
    }, METADATA_TIMEOUT_MS)

    video.addEventListener('loadedmetadata', handleLoaded)
    video.addEventListener('error', handleError)
  })
}

// メモリ解放のため、src除去→load()の順で明示的にネイティブのデコードリソースを破棄する
export function disposeOffscreenVideo(video: HTMLVideoElement) {
  video.pause()
  video.removeAttribute('src')
  video.load()
}
