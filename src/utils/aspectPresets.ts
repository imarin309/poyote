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

// 「そのまま」は拡縮すると元画像の画素を捨てるか水増しするだけなので、切り取った画素数で書き出す
export function presetOutputSize(
  preset: AspectPreset,
  sourceRect: SourceRect,
): Size {
  if (preset.kind === 'original') {
    return { width: sourceRect.width, height: sourceRect.height }
  }
  return { width: preset.width, height: preset.height }
}
