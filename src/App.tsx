import { useState } from 'react'
import { useRoute } from './hooks/useRoute'
import { TopPage } from './pages/TopPage'
import { VideoPage } from './pages/VideoPage'
import { ImagePage } from './pages/ImagePage'
import { HelpTour } from './components/HelpTour/HelpTour'

function App() {
  const { route, navigate } = useRoute()
  const [helpOpen, setHelpOpen] = useState(false)

  const openHelp = () => setHelpOpen(true)
  const pageProps = { route, onNavigate: navigate, onOpenHelp: openHelp }

  return (
    <>
      {route === 'video' && <VideoPage {...pageProps} helpOpen={helpOpen} />}
      {route === 'image' && <ImagePage {...pageProps} />}
      {route === 'top' && <TopPage {...pageProps} />}
      {helpOpen && <HelpTour onClose={() => setHelpOpen(false)} />}
    </>
  )
}

export default App
