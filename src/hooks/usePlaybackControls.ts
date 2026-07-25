import { useCallback, useEffect, useRef, useState } from 'react'
import { clampTime } from '../utils/clampTime'

export function usePlaybackControls() {
  const nodeRef = useRef<HTMLVideoElement | null>(null)
  const [videoNode, setVideoNode] = useState<HTMLVideoElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPaused, setIsPaused] = useState(true)

  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    nodeRef.current = node
    setVideoNode(node)
    if (!node) {
      setCurrentTime(0)
      setDuration(0)
      setIsPaused(true)
    }
  }, [])

  useEffect(() => {
    if (!videoNode) {
      return
    }

    const handleTimeUpdate = () => setCurrentTime(videoNode.currentTime)
    const handleLoadedMetadata = () => {
      setDuration(videoNode.duration)
      setCurrentTime(videoNode.currentTime)
    }
    const handlePlay = () => setIsPaused(false)
    const handlePause = () => setIsPaused(true)

    videoNode.addEventListener('timeupdate', handleTimeUpdate)
    videoNode.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoNode.addEventListener('play', handlePlay)
    videoNode.addEventListener('pause', handlePause)

    return () => {
      videoNode.removeEventListener('timeupdate', handleTimeUpdate)
      videoNode.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoNode.removeEventListener('play', handlePlay)
      videoNode.removeEventListener('pause', handlePause)
    }
  }, [videoNode])

  // iOS Safari 等では一時停止中に currentTime を書き換えてもシークが確定されず、
  // 再生を再開すると元の位置から始まることがある。一瞬 play→pause を挟むことで
  // シークを確定させ、モバイルでもタップ位置が映像に反映されるようにする
  const commitSeek = useCallback((node: HTMLVideoElement) => {
    if (!node.paused) {
      return
    }

    void node
      .play()
      .then(() => node.pause())
      .catch(() => {})
  }, [])

  const seekBy = useCallback((deltaSeconds: number) => {
    const node = nodeRef.current
    if (!node || !Number.isFinite(node.duration)) {
      return
    }

    node.currentTime = clampTime(node.currentTime + deltaSeconds, node.duration)
    commitSeek(node)
  }, [commitSeek])

  const seekTo = useCallback((time: number) => {
    const node = nodeRef.current
    if (!node || !Number.isFinite(node.duration)) {
      return
    }

    node.currentTime = clampTime(time, node.duration)
    commitSeek(node)
  }, [commitSeek])

  const togglePlayPause = useCallback(() => {
    const node = nodeRef.current
    if (!node) {
      return
    }

    if (node.paused) {
      void node.play()
    } else {
      node.pause()
    }
  }, [])

  return {
    videoRef,
    videoNode,
    videoNodeRef: nodeRef,
    currentTime,
    duration,
    isPaused,
    seekBy,
    seekTo,
    togglePlayPause,
  }
}
