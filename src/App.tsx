import { useState } from 'react'
import { useRoute } from './hooks/useRoute'
import { TopPage } from './pages/TopPage'
import { VideoPage } from './pages/VideoPage'
import { ImagePage } from './pages/ImagePage'
import { HelpTour } from './components/HelpTour/HelpTour'
import { imageHelpSteps, videoHelpSteps } from './components/HelpTour/helpSteps'
import type { HelpStep } from './components/HelpTour/helpSteps'
import type { Route } from './types/route'

// ヘルプはページごとに内容が違う。トップは機能を選ぶだけなので持たない
const HELP_STEPS: Partial<Record<Route, HelpStep[]>> = {
  video: videoHelpSteps,
  image: imageHelpSteps,
}

function App() {
  const { route, navigate } = useRoute()
  const [helpOpen, setHelpOpen] = useState(false)

  const openHelp = () => setHelpOpen(true)
  const pageProps = { route, onNavigate: navigate, onOpenHelp: openHelp }
  const helpSteps = HELP_STEPS[route]

  return (
    <>
      {route === 'video' && <VideoPage {...pageProps} helpOpen={helpOpen} />}
      {route === 'image' && <ImagePage {...pageProps} />}
      {route === 'top' && <TopPage route={route} onNavigate={navigate} />}
      {helpOpen && helpSteps && (
        <HelpTour steps={helpSteps} onClose={() => setHelpOpen(false)} />
      )}
    </>
  )
}

export default App
