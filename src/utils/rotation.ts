import type { Size } from './cropRect'

export type Rotation = 0 | 90 | 180 | 270
export type RotateDirection = 'left' | 'right'

const ROTATIONS: Rotation[] = [0, 90, 180, 270]

export function nextRotation(
  current: Rotation,
  direction: RotateDirection,
): Rotation {
  const step = direction === 'right' ? 1 : -1
  const index = ROTATIONS.indexOf(current)
  return ROTATIONS[(index + step + ROTATIONS.length) % ROTATIONS.length]
}

export function rotatedSize(size: Size, rotation: Rotation): Size {
  return rotation === 90 || rotation === 270
    ? { width: size.height, height: size.width }
    : size
}
