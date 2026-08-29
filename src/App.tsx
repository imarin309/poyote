import { useState } from 'react'
import { useRoute } from './hooks/useRoute'
import { VideoPage } from './pages/VideoPage'
import { ImagePage } from './pages/ImagePage'
import { HelpTour } from './components/HelpTour/HelpTour'

function App() {
  const { route, navigate } = useRoute()
  const [helpOpen, setHelpOpen] = useState(false)

  const openHelp = () => setHelpOpen(true)

  return (
    <>
      {route === 'image' ? (
        <ImagePage route={route} onNavigate={navigate} onOpenHelp={openHelp} />
      ) : (
        <VideoPage
          route={route}
          onNavigate={navigate}
          onOpenHelp={openHelp}
          helpOpen={helpOpen}
        />
      )}
      {helpOpen && <HelpTour onClose={() => setHelpOpen(false)} />}
    </>
  )
}

export default App
