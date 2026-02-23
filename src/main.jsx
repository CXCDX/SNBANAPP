import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PreviewPage from './components/PreviewPage.jsx'
import { AppProvider } from './store/AppContext'

function Router() {
  const [route, setRoute] = useState(window.location.hash)

  useEffect(() => {
    const handler = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  const previewMatch = route.match(/^#\/preview\/(.+)$/)
  if (previewMatch) {
    return <PreviewPage previewId={previewMatch[1]} />
  }

  return (
    <AppProvider>
      <App />
    </AppProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
