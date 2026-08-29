import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Header } from './Header'
import { MODE_DESCRIPTIONS, MODE_LABELS } from '../../types/mode'

describe('Header', () => {
  it('選択中のモードに応じた説明を表示する', () => {
    render(<Header mode="image" onModeChange={vi.fn()} onOpenHelp={vi.fn()} />)
    expect(screen.getByText(MODE_DESCRIPTIONS.image)).toBeInTheDocument()
  })

  it('選択中のモードのタブだけがaria-selectedになる', () => {
    render(<Header mode="video" onModeChange={vi.fn()} onOpenHelp={vi.fn()} />)
    expect(screen.getByTestId('mode-tab-video')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByTestId('mode-tab-image')).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('タブのクリックでonModeChangeが呼ばれる', () => {
    const onModeChange = vi.fn()
    render(
      <Header mode="video" onModeChange={onModeChange} onOpenHelp={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('tab', { name: MODE_LABELS.image }))
    expect(onModeChange).toHaveBeenCalledWith('image')
  })
})
