import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HelpTour } from './HelpTour'
import type { HelpStep } from './helpSteps'

const steps: HelpStep[] = [
  { icon: '1️⃣', title: 'ひとつめ', description: 'さいしょの説明' },
  { icon: '2️⃣', title: 'ふたつめ', description: 'つぎの説明' },
]

describe('HelpTour', () => {
  it('渡されたステップを表示する', () => {
    render(<HelpTour steps={steps} onClose={vi.fn()} />)

    expect(screen.getByText('ひとつめ')).toBeInTheDocument()
    expect(screen.getByText('さいしょの説明')).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('画像が無いステップでは絵文字を代わりに出す', () => {
    render(<HelpTour steps={steps} onClose={vi.fn()} />)
    expect(screen.getByText('1️⃣')).toBeInTheDocument()
  })
})
