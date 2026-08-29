export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

export interface SourceRect {
  left: number
  top: number
  width: number
  height: number
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

export const MIN_CROP_SIZE = 40

export function createInitialCrop(bounds: Size, ratio: number): CropRect {
  if (bounds.width <= 0 || bounds.height <= 0 || ratio <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let width = bounds.width
  let height = width / ratio
  if (height > bounds.height) {
    height = bounds.height
    width = height * ratio
  }

  return {
    x: (bounds.width - width) / 2,
    y: (bounds.height - height) / 2,
    width,
    height,
  }
}

export function moveCrop(
  start: CropRect,
  deltaX: number,
  deltaY: number,
  bounds: Size,
): CropRect {
  return {
    ...start,
    x: clamp(start.x + deltaX, 0, bounds.width - start.width),
    y: clamp(start.y + deltaY, 0, bounds.height - start.height),
  }
}

export function resizeCrop(
  start: CropRect,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
  ratio: number,
  bounds: Size,
): CropRect {
  const growsRight = handle === 'se' || handle === 'ne'
  const growsDown = handle === 'se' || handle === 'sw'

  // ドラッグしている角の対角を固定点にすることで、比率を保ったままリサイズできる
  const anchorX = growsRight ? start.x : start.x + start.width
  const anchorY = growsDown ? start.y : start.y + start.height

  const availableWidth = growsRight ? bounds.width - anchorX : anchorX
  const availableHeight = growsDown ? bounds.height - anchorY : anchorY
  const maxWidth = Math.min(availableWidth, availableHeight * ratio)

  // 比率が固定なので幅だけで矩形が決まる。縦のドラッグ量も幅に換算したうえで、
  // 大きく動いた側だけを使う（斜めに引いたとき倍の速さで伸びないように）
  const growX = growsRight ? deltaX : -deltaX
  const growY = (growsDown ? deltaY : -deltaY) * ratio
  const growth = Math.abs(growY) > Math.abs(growX) ? growY : growX

  const requested = start.width + growth
  const width = clamp(requested, Math.min(MIN_CROP_SIZE, maxWidth), maxWidth)
  const height = width / ratio

  return {
    x: growsRight ? anchorX : anchorX - width,
    y: growsDown ? anchorY : anchorY - height,
    width,
    height,
  }
}

export function toSourceRect(
  crop: CropRect,
  displaySize: Size,
  sourceSize: Size,
): SourceRect {
  if (displaySize.width <= 0 || displaySize.height <= 0) {
    return { left: 0, top: 0, width: 0, height: 0 }
  }

  const scaleX = sourceSize.width / displaySize.width
  const scaleY = sourceSize.height / displaySize.height

  const left = clamp(Math.round(crop.x * scaleX), 0, sourceSize.width)
  const top = clamp(Math.round(crop.y * scaleY), 0, sourceSize.height)

  return {
    left,
    top,
    width: clamp(Math.round(crop.width * scaleX), 0, sourceSize.width - left),
    height: clamp(Math.round(crop.height * scaleY), 0, sourceSize.height - top),
  }
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min
  }

  return Math.min(Math.max(value, min), max)
}
