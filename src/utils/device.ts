export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent)
}
