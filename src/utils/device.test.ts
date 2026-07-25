import { afterEach, describe, expect, it, vi } from 'vitest'
import { isMobileDevice } from './device'

describe('isMobileDevice', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    [
      'iPhone Safari',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15',
      true,
    ],
    [
      'iPad Safari',
      'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15',
      true,
    ],
    [
      'Android Chrome',
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/125.0 Mobile Safari/537.36',
      true,
    ],
    [
      'macOS Chrome',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0 Safari/537.36',
      false,
    ],
    [
      'Windows Firefox',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
      false,
    ],
  ])('%s -> %s', (_label, userAgent, expected) => {
    vi.stubGlobal('navigator', { userAgent })
    expect(isMobileDevice()).toBe(expected)
  })
})
