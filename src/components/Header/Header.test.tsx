import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Header } from './Header'
import { ROUTE_DESCRIPTIONS, ROUTE_LABELS } from '../../types/route'

describe('Header', () => {
  it('現在のページに応じた説明を表示する', () => {
    render(<Header route="image" onNavigate={vi.fn()} onOpenHelp={vi.fn()} />)
    expect(screen.getByText(ROUTE_DESCRIPTIONS.image)).toBeInTheDocument()
  })

  it('各ページのリンクを実URLで出す', () => {
    render(<Header route="video" onNavigate={vi.fn()} onOpenHelp={vi.fn()} />)
    expect(screen.getByTestId('nav-top')).toHaveAttribute('href', '/')
    expect(screen.getByTestId('nav-video')).toHaveAttribute('href', '/movie')
    expect(screen.getByTestId('nav-image')).toHaveAttribute('href', '/image')
  })

  it('現在のページのリンクにaria-currentを付ける', () => {
    render(<Header route="video" onNavigate={vi.fn()} onOpenHelp={vi.fn()} />)
    expect(screen.getByTestId('nav-video')).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByTestId('nav-image')).not.toHaveAttribute('aria-current')
  })

  it('クリックで既定の遷移を止めてonNavigateを呼ぶ', () => {
    const onNavigate = vi.fn()
    render(
      <Header route="video" onNavigate={onNavigate} onOpenHelp={vi.fn()} />,
    )

    const link = screen.getByRole('link', { name: ROUTE_LABELS.image })
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    fireEvent(link, event)

    expect(onNavigate).toHaveBeenCalledWith('image')
    expect(event.defaultPrevented).toBe(true)
  })

  it('見出しのリンクでトップページへ戻る', () => {
    const onNavigate = vi.fn()
    render(
      <Header route="video" onNavigate={onNavigate} onOpenHelp={vi.fn()} />,
    )

    fireEvent.click(screen.getByTestId('nav-top'))

    expect(onNavigate).toHaveBeenCalledWith('top')
  })

  it('修飾キー付きのクリックはブラウザ本来の遷移に任せる', () => {
    const onNavigate = vi.fn()
    render(
      <Header route="video" onNavigate={onNavigate} onOpenHelp={vi.fn()} />,
    )

    const link = screen.getByRole('link', { name: ROUTE_LABELS.image })
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      metaKey: true,
    })
    fireEvent(link, event)

    expect(onNavigate).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })
})
