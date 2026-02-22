import { useAppState } from './store/AppContext'
import LeftPanel from './components/LeftPanel'
import CenterCanvas from './components/CenterCanvas'
import RightPanel from './components/RightPanel'
import ExpandedPreview from './components/ExpandedPreview'
import ToastContainer from './components/Toast'
import MobileTabBar from './components/MobileTabBar'
import ImageUpload from './components/ImageUpload'
import TextInputs from './components/TextInputs'
import BrandSettings from './components/BrandSettings'
import BadgeLibrary from './components/BadgeLibrary'
import FontManager from './components/FontManager'
import ExportPanel from './components/ExportPanel'

function MobileView() {
  const { activeTab } = useAppState()

  return (
    <div className="md:hidden flex flex-col h-screen pb-12 bg-bg">
      {activeTab === 'controls' && (
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-5">
          <header className="space-y-0.5">
            <p className="font-editorial text-[12px] uppercase tracking-[0.12em] leading-none text-ink">
              Banner Studio
            </p>
            <p className="font-editorial text-[9px] uppercase tracking-[0.12em] leading-none text-secondary">
              SharkNinja
            </p>
          </header>
          <div className="h-px bg-border" />
          <ImageUpload />
          <div className="h-px bg-border" />
          <FontManager />
          <div className="h-px bg-border" />
          <TextInputs />
          <div className="h-px bg-border" />
          <BadgeLibrary />
          <div className="h-px bg-border" />
          <BrandSettings />
        </div>
      )}
      {activeTab === 'preview' && (
        <div className="flex-1 overflow-y-auto">
          <CenterCanvas />
        </div>
      )}
      {activeTab === 'export' && (
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <ExportPanel />
        </div>
      )}
      <MobileTabBar />
    </div>
  )
}

function DesktopView() {
  return (
    <div className="hidden md:flex h-screen overflow-hidden bg-bg">
      <LeftPanel />
      <CenterCanvas />
      <RightPanel />
    </div>
  )
}

export default function App() {
  return (
    <>
      <DesktopView />
      <MobileView />
      <ExpandedPreview />
      <ToastContainer />
    </>
  )
}
