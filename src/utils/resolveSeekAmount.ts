interface SeekModifiers {
  shift: boolean
  alt: boolean
}

export function resolveSeekAmount(
  key: string,
  modifiers: SeekModifiers,
): number | null {
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') {
    return null
  }

  const direction = key === 'ArrowLeft' ? -1 : 1
  const magnitude = modifiers.shift ? 0.1 : modifiers.alt ? 10 : 1

  return direction * magnitude
}
