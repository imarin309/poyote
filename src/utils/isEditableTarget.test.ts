import { describe, expect, it } from 'vitest'
import { isEditableTarget } from './isEditableTarget'

describe('isEditableTarget', () => {
  it('inputはtrueを返す', () => {
    expect(isEditableTarget(document.createElement('input'))).toBe(true)
  })

  it('textareaはtrueを返す', () => {
    expect(isEditableTarget(document.createElement('textarea'))).toBe(true)
  })

  it('selectはtrueを返す', () => {
    expect(isEditableTarget(document.createElement('select'))).toBe(true)
  })

  it('contenteditableな要素はtrueを返す', () => {
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'true')
    expect(isEditableTarget(div)).toBe(true)
  })

  it('通常のボタンはfalseを返す', () => {
    expect(isEditableTarget(document.createElement('button'))).toBe(false)
  })

  it('nullはfalseを返す', () => {
    expect(isEditableTarget(null)).toBe(false)
  })
})
