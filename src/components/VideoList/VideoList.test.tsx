import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VideoList } from './VideoList'
import type { LoadedVideo } from '../../types/video'

function loadedVideo(name: string): LoadedVideo {
  return {
    file: new File([''], name, { type: 'video/mp4' }),
    objectUrl: `blob:${name}`,
  }
}

const neverUnplayable = () => false

describe('VideoList', () => {
  it('読み込んだ動画をすべて並べる', () => {
    render(
      <VideoList
        videos={[loadedVideo('a.mp4'), loadedVideo('b.mp4')]}
        selectedIndex={0}
        isUnplayable={neverUnplayable}
        onSelect={vi.fn()}
        onReload={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'a.mp4' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'b.mp4' })).toBeInTheDocument()
  })

  it('選択中の項目にaria-currentを付ける', () => {
    render(
      <VideoList
        videos={[loadedVideo('a.mp4'), loadedVideo('b.mp4')]}
        selectedIndex={1}
        isUnplayable={neverUnplayable}
        onSelect={vi.fn()}
        onReload={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'b.mp4' })).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(screen.getByRole('button', { name: 'a.mp4' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('クリックでその位置を選択する', () => {
    const onSelect = vi.fn()
    render(
      <VideoList
        videos={[loadedVideo('a.mp4'), loadedVideo('b.mp4')]}
        selectedIndex={0}
        isUnplayable={neverUnplayable}
        onSelect={onSelect}
        onReload={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'b.mp4' }))

    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('再生できない動画は選べないまま残る', () => {
    const videos = [loadedVideo('a.mp4'), loadedVideo('broken.mp4')]
    render(
      <VideoList
        videos={videos}
        selectedIndex={0}
        isUnplayable={(video) => video.file.name === 'broken.mp4'}
        onSelect={vi.fn()}
        onReload={vi.fn()}
      />,
    )

    const item = screen.getByRole('button', { name: /broken\.mp4/ })
    expect(item).toBeDisabled()
    expect(item).toHaveTextContent('再生不可')
  })

  it('1本だけのときは切り替えの項目を出さない', () => {
    render(
      <VideoList
        videos={[loadedVideo('a.mp4')]}
        selectedIndex={0}
        isUnplayable={neverUnplayable}
        onSelect={vi.fn()}
        onReload={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'a.mp4' })).toBeNull()
  })

  it('1本だけでも読み込み直せる', () => {
    const onReload = vi.fn()
    render(
      <VideoList
        videos={[loadedVideo('a.mp4')]}
        selectedIndex={0}
        isUnplayable={neverUnplayable}
        onSelect={vi.fn()}
        onReload={onReload}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '読み込み直す' }))

    expect(onReload).toHaveBeenCalled()
  })
})
