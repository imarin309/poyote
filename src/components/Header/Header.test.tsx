import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Header } from './Header'
import { ROUTE_DESCRIPTIONS } from '../../types/route'

describe('Header', () => {
  it('現在のページに応じた説明を表示する', () => {
    render(<Header route="image" onNavigate={vi.fn()} onOpenHelp={vi.fn()} />)
    expect(screen.getByText(ROUTE_DESCRIPTIONS.image)).toBeInTheDocument()
  })

  it('見出しをトップページへの実URLのリンクにする', () => {
    render(<Header route="video" onNavigate={vi.fn()} onOpenHelp={vi.fn()} />)
    expect(screen.getByTestId('nav-top')).toHaveAttribute('href', '/')
  })

  it('クリックで既定の遷移を止めてonNavigateを呼ぶ', () => {
    const onNavigate = vi.fn()
    render(
      <Header route="video" onNavigate={onNavigate} onOpenHelp={vi.fn()} />,
    )

    const link = screen.getByTestId('nav-top')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    fireEvent(link, event)

    expect(onNavigate).toHaveBeenCalledWith('top')
    expect(event.defaultPrevented).toBe(true)
  })

  it('修飾キー付きのクリックはブラウザ本来の遷移に任せる', () => {
    const onNavigate = vi.fn()
    render(
      <Header route="video" onNavigate={onNavigate} onOpenHelp={vi.fn()} />,
    )

    const link = screen.getByTestId('nav-top')
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      metaKey: true,
    })
    fireEvent(link, event)

    expect(onNavigate).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('onOpenHelpを渡さないページではヘルプボタンを出さない', () => {
    render(<Header route="top" onNavigate={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /Help/ })).toBeNull()
  })
})
