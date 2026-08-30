export const INITIAL_QUALITY = 0.85
export const MIN_QUALITY = 0.3
export const QUALITY_STEP = 0.05
export const MAX_OUTPUT_BYTES = 200 * 1024

// 容量が上限に収まるまで順に試す品質の並び。
// 0.85 から 0.05 を繰り返し引くと誤差が溜まって下限の1段手前で止まるため、
// 段数を先に求めて添字から各値を計算する（EPSILON は (0.85-0.3)/0.05 が
// 11.000000000000002 のようにわずかに上下する分の吸収）
const EPSILON = 1e-9

export function buildQualitySteps(
  initial: number = INITIAL_QUALITY,
  min: number = MIN_QUALITY,
  step: number = QUALITY_STEP,
): number[] {
  if (step <= 0 || initial < min) {
    return [initial]
  }

  const count = Math.floor((initial - min) / step + EPSILON)

  return Array.from(
    { length: count + 1 },
    (_, index) => Math.round((initial - index * step) * 100) / 100,
  )
}
