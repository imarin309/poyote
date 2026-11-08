import type { DiscardedTrack } from 'mediabunny'
import type { CompressionSettings } from '../types/compression'
import {
  OUTPUT_FRAME_RATE,
  resolveEncoding,
  resolveOutputSize,
} from '../utils/compressionPlan'

// 画面に出してよいメッセージを持つエラー。それ以外はライブラリ内部の英文なので画面には出さない
export class CompressionError extends Error {}

const UNDECODABLE_MESSAGE =
  'このブラウザではこの動画を読み込めません。iPhoneで撮ったHEVCの動画は、SafariかChromeでお試しください。'

function describeDiscardedVideo(reason: DiscardedTrack['reason']): string {
  if (reason === 'undecodable_source_codec') {
    return UNDECODABLE_MESSAGE
  }
  if (reason === 'no_encodable_target_codec') {
    return 'このブラウザではH.264で書き出せません。別のブラウザでお試しください。'
  }

  return '動画を変換できませんでした。'
}

interface CompressVideoOptions {
  settings: CompressionSettings
  onProgress: (progress: number) => void
  signal: AbortSignal
}

export async function compressVideo(
  file: File,
  { settings, onProgress, signal }: CompressVideoOptions,
): Promise<Blob> {
  // mediabunny は他のページでは使わないため、変換を始めたときにだけ読み込む
  const {
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    Conversion,
    Input,
    Mp4OutputFormat,
    Output,
    Quality,
  } = await import('mediabunny')

  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  })

  try {
    const videoTrack = await input.getPrimaryVideoTrack()
    if (!videoTrack) {
      throw new CompressionError('動画の映像を読み取れませんでした。')
    }
    if (!(await videoTrack.canDecode())) {
      throw new CompressionError(UNDECODABLE_MESSAGE)
    }

    // 回転後の大きさで上限を決めないと、縦長の動画を横長の枠に当ててしまう
    const size = resolveOutputSize({
      width: await videoTrack.getDisplayWidth(),
      height: await videoTrack.getDisplayHeight(),
    })
    const { quantizer, bitrate } = resolveEncoding(settings.quality, size)

    const target = new BufferTarget()
    const output = new Output({
      // ダウンロードしきる前に再生を始められるよう、moov を先頭に置く
      format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
      target,
    })

    const conversion = await Conversion.init({
      input,
      output,
      tracks: 'primary',
      video: {
        ...size,
        fit: 'contain',
        frameRate: OUTPUT_FRAME_RATE,
        codec: 'avc',
        // quantizer を使えないブラウザでは bitrate で変換される
        quality: new Quality({ quantizer, bitrate }),
        // 回転情報を残すと、対応していない再生環境で横倒しになるため映像に焼き込む
        allowTransformationMetadata: false,
        forceTranscode: true,
      },
      audio: settings.removeAudio ? { discard: true } : { codec: 'aac' },
      // 既定では入力のタグ（機種・位置情報など）がコピーされるため、空にして消す
      tags: {},
      showWarnings: false,
    })

    const discardedVideo = conversion.discardedTracks.find(({ track }) =>
      track.isVideoTrack(),
    )
    if (discardedVideo) {
      throw new CompressionError(describeDiscardedVideo(discardedVideo.reason))
    }
    const discardedAudio = conversion.discardedTracks.find(
      ({ track, reason }) =>
        track.isAudioTrack() && reason !== 'discarded_by_user',
    )
    if (discardedAudio) {
      throw new CompressionError(
        'このブラウザでは音声を変換できません。「音声を消す」をオンにしてお試しください。',
      )
    }
    if (!conversion.isValid) {
      throw new CompressionError('動画を変換できませんでした。')
    }

    signal.throwIfAborted()
    signal.addEventListener('abort', () => void conversion.cancel(), {
      once: true,
    })
    conversion.onProgress = (progress) => onProgress(progress)

    await conversion.execute()

    if (!target.buffer) {
      throw new CompressionError('動画を変換できませんでした。')
    }

    return new Blob([target.buffer], { type: 'video/mp4' })
  } finally {
    input.dispose()
  }
}
