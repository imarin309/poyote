export type CompressionQuality = 'high' | 'standard' | 'light'

export interface CompressionSettings {
  quality: CompressionQuality
  removeAudio: boolean
}

export interface CompressionResult {
  blob: Blob
  objectUrl: string
  filename: string
}

export type CompressionStatus =
  | { phase: 'idle' }
  // progress は 0〜1
  | { phase: 'converting'; progress: number }
  | { phase: 'done'; result: CompressionResult }
  | { phase: 'error'; message: string }
