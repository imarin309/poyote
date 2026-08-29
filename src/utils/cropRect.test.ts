import { describe, expect, it } from 'vitest'
import {
  createInitialCrop,
  MIN_CROP_SIZE,
  moveCrop,
  rescaleCrop,
  resizeCrop,
  toSourceRect,
} from './cropRect'

const BOUNDS = { width: 800, height: 450 }

describe('createInitialCrop', () => {
  it('横幅いっぱいに収まる場合は幅基準で中央寄せする', () => {
    expect(createInitialCrop(BOUNDS, 16 / 9)).toEqual({
      x: 0,
      y: 0,
      width: 800,
      height: 450,
    })
  })

  it('高さがはみ出す場合は高さ基準に切り替える', () => {
    const crop = createInitialCrop(BOUNDS, 3 / 4)
    expect(crop.height).toBe(450)
    expect(crop.width).toBeCloseTo(337.5)
    expect(crop.x).toBeCloseTo((800 - 337.5) / 2)
    expect(crop.y).toBe(0)
  })

  it('サイズが0の場合は空の矩形を返す', () => {
    expect(createInitialCrop({ width: 0, height: 0 }, 16 / 9)).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    })
  })
})

describe('moveCrop', () => {
  const start = { x: 100, y: 50, width: 400, height: 225 }

  it('差分ぶんだけ移動する', () => {
    expect(moveCrop(start, 30, -20, BOUNDS)).toEqual({
      ...start,
      x: 130,
      y: 30,
    })
  })

  it('左上をはみ出さない', () => {
    expect(moveCrop(start, -999, -999, BOUNDS)).toEqual({
      ...start,
      x: 0,
      y: 0,
    })
  })

  it('右下をはみ出さない', () => {
    expect(moveCrop(start, 999, 999, BOUNDS)).toEqual({
      ...start,
      x: 400,
      y: 225,
    })
  })
})

describe('resizeCrop', () => {
  const ratio = 16 / 9
  const start = { x: 200, y: 100, width: 320, height: 180 }

  it('se ハンドルは左上を固定して比率を保つ', () => {
    const crop = resizeCrop(start, 'se', 80, 0, ratio, BOUNDS)
    expect(crop.x).toBe(200)
    expect(crop.y).toBe(100)
    expect(crop.width).toBe(400)
    expect(crop.height).toBeCloseTo(225)
  })

  it('nw ハンドルは右下を固定して左上へ広がる', () => {
    const crop = resizeCrop(start, 'nw', -80, 0, ratio, BOUNDS)
    expect(crop.width).toBe(400)
    expect(crop.height).toBeCloseTo(225)
    expect(crop.x + crop.width).toBe(520)
    expect(crop.y + crop.height).toBe(280)
  })

  it('sw ハンドルは右上を固定する', () => {
    const crop = resizeCrop(start, 'sw', -80, 0, ratio, BOUNDS)
    expect(crop.x + crop.width).toBe(520)
    expect(crop.y).toBe(100)
    expect(crop.width).toBe(400)
  })

  it('ne ハンドルは左下を固定する', () => {
    const crop = resizeCrop(start, 'ne', 80, 0, ratio, BOUNDS)
    expect(crop.x).toBe(200)
    expect(crop.y + crop.height).toBe(280)
    expect(crop.width).toBe(400)
  })

  it('縦方向のドラッグでもリサイズできる', () => {
    const crop = resizeCrop(start, 'se', 0, 80, ratio, BOUNDS)
    expect(crop.width).toBeCloseTo(320 + 80 * ratio)
    expect(crop.x).toBe(200)
    expect(crop.y).toBe(100)
  })

  it('上方向へ引くハンドルでも縦のドラッグが効く', () => {
    const crop = resizeCrop(start, 'nw', 0, -80, ratio, BOUNDS)
    expect(crop.width).toBeCloseTo(320 + 80 * ratio)
    expect(crop.x + crop.width).toBe(520)
    expect(crop.y + crop.height).toBe(280)
  })

  it('斜めのドラッグでは大きく動いた側だけを使う', () => {
    const crop = resizeCrop(start, 'se', 80, 80, ratio, BOUNDS)
    // 縦80pxは幅に換算すると80*ratio。横80pxとの合計にはしない
    expect(crop.width).toBeCloseTo(320 + 80 * ratio)
  })

  it('縦に縮める方向のドラッグも効く', () => {
    const crop = resizeCrop(start, 'se', 0, -50, ratio, BOUNDS)
    expect(crop.width).toBeCloseTo(320 - 50 * ratio)
  })

  it('最小サイズより小さくならない', () => {
    const crop = resizeCrop(start, 'se', -999, 0, ratio, BOUNDS)
    expect(crop.width).toBe(MIN_CROP_SIZE)
    expect(crop.height).toBeCloseTo(MIN_CROP_SIZE / ratio)
  })

  it('拡大しても比率を保ったまま境界内に収まる', () => {
    const crop = resizeCrop(start, 'se', 999, 0, ratio, BOUNDS)
    expect(crop.width / crop.height).toBeCloseTo(ratio)
    expect(crop.x + crop.width).toBeLessThanOrEqual(BOUNDS.width)
    expect(crop.y + crop.height).toBeLessThanOrEqual(BOUNDS.height)
  })

  it('幅側が先に境界へ当たる場合は幅で頭打ちになる', () => {
    const crop = resizeCrop(start, 'se', 999, 0, ratio, BOUNDS)
    expect(crop.width).toBeCloseTo(600)
    expect(crop.height).toBeCloseTo(600 / ratio)
  })

  it('高さ側が先に境界へ当たる場合は高さで頭打ちになる', () => {
    const tall = { x: 50, y: 100, width: 320, height: 180 }
    const crop = resizeCrop(tall, 'se', 999, 0, ratio, BOUNDS)
    expect(crop.height).toBeCloseTo(350)
    expect(crop.width).toBeCloseTo(350 * ratio)
  })

  it('固定点に余白がない場合でも矩形が反転しない', () => {
    const flush = { x: 0, y: 0, width: 320, height: 180 }
    const crop = resizeCrop(flush, 'nw', -80, 0, ratio, BOUNDS)
    expect(crop.x).toBe(0)
    expect(crop.y).toBe(0)
    expect(crop.width).toBeGreaterThanOrEqual(0)
  })
})

describe('rescaleCrop', () => {
  const ratio = 16 / 9

  it('表示サイズの変化にあわせて拡縮する', () => {
    const crop = { x: 100, y: 50, width: 400, height: 225 }
    const scaled = rescaleCrop(crop, BOUNDS, { width: 400, height: 225 }, ratio)
    expect(scaled.x).toBeCloseTo(50)
    expect(scaled.y).toBeCloseTo(25)
    expect(scaled.width).toBeCloseTo(200)
    expect(scaled.height).toBeCloseTo(112.5)
  })

  it('縦横の倍率がずれても比率を保つ', () => {
    const crop = { x: 0, y: 0, width: 400, height: 225 }
    // clientWidth/Height は整数に丸められるため縦横の倍率が一致しないことがある
    const scaled = rescaleCrop(crop, BOUNDS, { width: 601, height: 337 }, ratio)
    expect(scaled.width / scaled.height).toBeCloseTo(ratio)
  })

  it('拡縮した結果が表示領域からはみ出さない', () => {
    const crop = { x: 0, y: 0, width: 800, height: 450 }
    const scaled = rescaleCrop(crop, BOUNDS, { width: 800, height: 300 }, ratio)
    expect(scaled.height).toBeLessThanOrEqual(300)
    expect(scaled.width / scaled.height).toBeCloseTo(ratio)
    expect(scaled.x + scaled.width).toBeLessThanOrEqual(800)
    expect(scaled.y + scaled.height).toBeLessThanOrEqual(300)
  })

  it('元の表示サイズが0の場合は中央に作り直す', () => {
    const crop = { x: 0, y: 0, width: 10, height: 10 }
    expect(rescaleCrop(crop, { width: 0, height: 0 }, BOUNDS, ratio)).toEqual(
      createInitialCrop(BOUNDS, ratio),
    )
  })
})

describe('toSourceRect', () => {
  const display = { width: 800, height: 450 }
  const source = { width: 1920, height: 1080 }

  it('表示座標を元画像の座標へスケールする', () => {
    const crop = { x: 100, y: 50, width: 400, height: 225 }
    expect(toSourceRect(crop, display, source)).toEqual({
      left: 240,
      top: 120,
      width: 960,
      height: 540,
    })
  })

  it('丸め誤差で元画像の範囲を超えない', () => {
    const crop = { x: 0, y: 0, width: 800.4, height: 450.4 }
    const rect = toSourceRect(crop, display, source)
    expect(rect.left + rect.width).toBeLessThanOrEqual(source.width)
    expect(rect.top + rect.height).toBeLessThanOrEqual(source.height)
  })

  it('表示サイズが0の場合は空の矩形を返す', () => {
    expect(
      toSourceRect(
        { x: 0, y: 0, width: 0, height: 0 },
        { width: 0, height: 0 },
        source,
      ),
    ).toEqual({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    })
  })
})
