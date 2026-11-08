import { useState } from 'react'
import { Header } from '../components/Header/Header'
import { VideoDropZone } from '../components/VideoDropZone/VideoDropZone'
import { CompressSettings } from '../components/CompressSettings/CompressSettings'
import { CompressResult } from '../components/CompressResult/CompressResult'
import { usePlaybackControls } from '../hooks/usePlaybackControls'
import type {
  CompressionSettings,
  CompressionStatus,
} from '../types/compression'
import type { Route } from '../types/route'

const DEFAULT_SETTINGS: CompressionSettings = {
  quality: 'standard',
  removeAudio: true,
}

// 変換処理は別PRで入れる。それまでは画面だけ公開し、変換ボタンは押せないままにする
const PLACEHOLDER_STATUS: CompressionStatus = { phase: 'idle' }
const noop = () => {}

interface CompressPageProps {
  route: Route
  onNavigate: (route: Route) => void
}

export function CompressPage({ route, onNavigate }: CompressPageProps) {
  const [file, setFile] = useState<File | null>(null)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [posterTime, setPosterTime] = useState(1)
  const { videoRef, currentTime, duration } = usePlaybackControls()

  const status = PLACEHOLDER_STATUS

  const handleFilesSelected = (files: File[]) => {
    setFile(files[0] ?? null)
  }

  const header = (
    <Header bordered={file !== null} route={route} onNavigate={onNavigate} />
  )

  if (!file) {
    return (
      <div className="flex min-h-screen flex-col items-center gap-8 bg-neutral-950 px-4 py-10 text-neutral-100">
        {header}
        <div className="flex flex-1 items-center justify-center">
          <VideoDropZone
            onFilesSelected={handleFilesSelected}
            error={null}
            multiple={false}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      {header}

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm wrap-anywhere text-neutral-300">{file.name}</p>
          <button
            type="button"
            onClick={() => setFile(null)}
            disabled={status.phase === 'converting'}
            className="shrink-0 rounded-md border border-neutral-600 px-3 py-1.5 text-sm hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            別の動画を選ぶ
          </button>
        </div>

        <CompressSettings
          settings={settings}
          onSettingsChange={setSettings}
          onConvert={noop}
          disabled
        />
        <p className="text-center text-sm text-neutral-400">
          変換機能は準備中です。
        </p>

        <CompressResult
          status={status}
          originalSize={file.size}
          onCancel={noop}
          videoRef={videoRef}
          currentTime={currentTime}
          duration={duration}
          onSaveVideo={noop}
          posterTime={posterTime}
          onPosterTimeChange={setPosterTime}
          onSavePoster={noop}
          isSavingPoster={false}
          posterError={null}
        />
      </main>
    </div>
  )
}
