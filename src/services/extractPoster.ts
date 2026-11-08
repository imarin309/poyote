import { encodeCanvasWithinSize } from './encodeImage'
import { CompressionError } from './compressVideo'

function toHtmlCanvas(
  source: HTMLCanvasElement | OffscreenCanvas,
): HTMLCanvasElement {
  if (source instanceof HTMLCanvasElement) {
    return source
  }

  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  canvas.getContext('2d')?.drawImage(source, 0, 0)
  return canvas
}

// <video> のシークは iOS Safari で確定しないことがあるため、mp4 を直接デコードして取り出す
export async function extractPoster(
  video: Blob,
  timeSeconds: number,
): Promise<Blob> {
  const { ALL_FORMATS, BlobSource, CanvasSink, Input } =
    await import('mediabunny')

  const input = new Input({
    source: new BlobSource(video),
    formats: ALL_FORMATS,
  })

  try {
    const videoTrack = await input.getPrimaryVideoTrack()
    if (!videoTrack) {
      throw new CompressionError('動画の映像を読み取れませんでした。')
    }

    const frame = await new CanvasSink(videoTrack).getCanvas(timeSeconds)
    if (!frame) {
      throw new CompressionError('指定した秒のフレームを取り出せませんでした。')
    }

    return await encodeCanvasWithinSize(toHtmlCanvas(frame.canvas))
  } finally {
    input.dispose()
  }
}
