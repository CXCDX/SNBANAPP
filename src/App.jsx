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
import ExportPanel from './components/ExportPanel'

function MobileView() {
  const { activeTab } = useAppState()

  return (
    <div className="md:hidden flex flex-col h-screen pb-12">
      {activeTab === 'controls' && (
        <div className="flex-1 overflow-y-auto px-5 py-8 space-y-10">
          <header>
            <p className="font-editorial text-[11px] uppercase tracking-[0.15em] leading-tight text-ink">
              Banner Studio
            </p>
            <p className="font-editorial text-[11px] uppercase tracking-[0.15em] leading-tight text-secondary">
              SharkNinja
            </p>
          </header>
          <div className="h-px bg-ink" />
          <ImageUpload />
          <div className="h-px bg-ink" />
          <TextInputs />
          <div className="h-px bg-ink" />
          <BrandSettings />
        </div>
      )}
      {activeTab === 'preview' && (
        <div className="flex-1 overflow-y-auto">
          <CenterCanvas />
        </div>
      )}
      {activeTab === 'export' && (
        <div className="flex-1 overflow-y-auto px-5 py-8">
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
