export interface AspectPreset {
  label: string
  width: number
  height: number
}

export const ASPECT_PRESETS: AspectPreset[] = [
  { label: '横長 16:9', width: 1200, height: 675 },
  { label: '横長 3:2', width: 1200, height: 800 },
  { label: '縦長 3:4', width: 800, height: 1067 },
  { label: '縦長 2:3', width: 800, height: 1200 },
]

export function presetRatio(preset: AspectPreset): number {
  return preset.width / preset.height
}
