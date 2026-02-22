import ImageUpload from './ImageUpload'
import TextInputs from './TextInputs'
import BrandSettings from './BrandSettings'
import BadgeLibrary from './BadgeLibrary'
import FontManager from './FontManager'

export default function LeftPanel() {
  return (
    <div className="flex h-full shrink-0" aria-label="Controls panel">
      {/* Black sidebar */}
      <div className="w-10 bg-sidebar shrink-0" />

      {/* Controls */}
      <aside className="w-[200px] shrink-0 bg-surface overflow-y-auto" style={{ borderRight: '0.5px solid #E0E0DC' }}>
        <div className="px-3 pt-5 pb-8 space-y-5">
          {/* Masthead */}
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
      </aside>
    </div>
  )
}
