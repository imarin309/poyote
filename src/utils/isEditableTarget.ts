const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (EDITABLE_TAGS.has(target.tagName)) {
    return true
  }

  const editableAncestor = target.closest('[contenteditable]')
  return (
    editableAncestor !== null &&
    editableAncestor.getAttribute('contenteditable') !== 'false'
  )
}
