const SEEK_TIMEOUT_MS = 2000

export function seekAndWait(
  video: HTMLVideoElement,
  time: number,
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false

    const finish = () => {
      if (settled) {
        return
      }
      settled = true
      video.removeEventListener('seeked', handleSeeked)
      clearTimeout(timer)
      resolve()
    }

    const handleSeeked = () => finish()

    video.addEventListener('seeked', handleSeeked)
    const timer = setTimeout(finish, SEEK_TIMEOUT_MS)
    video.currentTime = time
  })
}
