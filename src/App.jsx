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
import PreviewGrid from './components/PreviewGrid'
import ExportPanel from './components/ExportPanel'

function MobileView() {
  const { activeTab } = useAppState()

  return (
    <div className="md:hidden flex flex-col h-screen pb-14">
      {activeTab === 'controls' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h1 className="text-lg font-heading font-bold text-text-primary tracking-wide uppercase">
              Banner Studio
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">SharkNinja Turkey</p>
          </div>
          <ImageUpload />
          <div className="h-px bg-border" />
          <TextInputs />
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
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <PreviewGrid />
          <div className="h-px bg-border" />
          <ExportPanel />
        </div>
      )}
      <MobileTabBar />
    </div>
  )
}

function DesktopView() {
  return (
    <div className="hidden md:flex h-screen overflow-hidden">
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
