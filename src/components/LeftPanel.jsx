import ImageUpload from './ImageUpload'
import TextInputs from './TextInputs'
import BrandSettings from './BrandSettings'

export default function LeftPanel() {
  return (
    <div className="flex h-full shrink-0" aria-label="Controls panel">
      {/* Black sidebar — silent power */}
      <div className="w-10 bg-sidebar shrink-0" />

      {/* Controls */}
      <aside className="w-[200px] shrink-0 overflow-y-auto" style={{ borderRight: '0.5px solid #E0E0DC' }}>
        <div className="px-5 py-8 space-y-10">
          {/* Masthead */}
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
      </aside>
    </div>
  )
}
