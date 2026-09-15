import type { Size, SourceRect } from './cropRect'

export type AspectPreset =
  | { kind: 'fixed'; label: string; width: number; height: number }
  | { kind: 'original'; label: string }

export const ASPECT_PRESETS: AspectPreset[] = [
  { kind: 'fixed', label: '横長 16:9', width: 1200, height: 675 },
  { kind: 'fixed', label: '横長 3:2', width: 1200, height: 800 },
  { kind: 'fixed', label: '縦長 3:4', width: 800, height: 1067 },
  { kind: 'fixed', label: '縦長 2:3', width: 800, height: 1200 },
  { kind: 'original', label: 'そのまま' },
]

export function presetRatio(preset: AspectPreset, sourceSize: Size): number {
  if (preset.kind === 'original') {
    return sourceSize.width / sourceSize.height
  }
  return preset.width / preset.height
}

// 元画像の画素数のまま書き出すと、写真では容量上限に収めるための再エンコードが極端に重くなる。
// 他のプリセットと同じ大きさに揃え、小さい切り取りも同じく拡大する
export const ORIGINAL_LONG_SIDE = 1200

export function presetOutputSize(
  preset: AspectPreset,
  sourceRect: SourceRect,
): Size {
  if (preset.kind === 'fixed') {
    return { width: preset.width, height: preset.height }
  }

  if (sourceRect.width <= 0 || sourceRect.height <= 0) {
    return { width: 0, height: 0 }
  }

  const scale =
    ORIGINAL_LONG_SIDE / Math.max(sourceRect.width, sourceRect.height)
  return {
    width: Math.round(sourceRect.width * scale),
    height: Math.round(sourceRect.height * scale),
  }
}
