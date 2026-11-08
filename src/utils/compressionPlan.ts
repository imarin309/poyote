import type { CompressionQuality } from '../types/compression'
import { extensionForMimeType } from './fileName'

export const OUTPUT_FRAME_RATE = 30

// 縦長の動画も1080pとして扱えるよう、幅・高さではなく長辺・短辺で上限を決める
const MAX_LONG_SIDE = 1920
const MAX_SHORT_SIDE = 1080

// ffmpeg の crf 23 / 26 / 28 を比べた結果に合わせる
const QUANTIZERS: Record<CompressionQuality, number> = {
  high: 23,
  standard: 26,
  light: 28,
}

// quantizer を使えないブラウザ向けの予備のビットレート。780×720・30fps・36秒の
// 実測（crf 23=1.8MB、26=1.1MB、28=826KB）を1ピクセル・1フレームあたりに直した値
const BITS_PER_PIXEL: Record<CompressionQuality, number> = {
  high: 0.0237,
  standard: 0.0145,
  light: 0.0109,
}

export interface VideoSize {
  width: number
  height: number
}

export interface EncodingPlan {
  quantizer: number
  bitrate: number
}

// yuv420p は色差を2×2画素単位で持つため、幅・高さが奇数だとエンコードできない
function roundToEven(value: number): number {
  return Math.max(2, Math.round(value / 2) * 2)
}

export function resolveOutputSize(source: VideoSize): VideoSize {
  const longSide = Math.max(source.width, source.height)
  const shortSide = Math.min(source.width, source.height)
  const scale = Math.min(
    1,
    MAX_LONG_SIDE / longSide,
    MAX_SHORT_SIDE / shortSide,
  )

  return {
    width: roundToEven(source.width * scale),
    height: roundToEven(source.height * scale),
  }
}

export function resolveEncoding(
  quality: CompressionQuality,
  size: VideoSize,
): EncodingPlan {
  return {
    quantizer: QUANTIZERS[quality],
    bitrate: Math.round(
      size.width * size.height * OUTPUT_FRAME_RATE * BITS_PER_PIXEL[quality],
    ),
  }
}

export function buildCompressedFilename(baseFileName: string): string {
  return `${baseFileName}.mp4`
}

// poster は webp 非対応の環境で jpeg になるため、実際に生成できた形式から拡張子を決める
export function buildPosterFilename(
  baseFileName: string,
  mimeType: string,
): string {
  return `${baseFileName}-poster.${extensionForMimeType(mimeType)}`
}
