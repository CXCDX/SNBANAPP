import ImageUpload from './ImageUpload'
import TextInputs from './TextInputs'
import BrandSettings from './BrandSettings'
import BadgeLibrary from './BadgeLibrary'
import FontManager from './FontManager'

export default function LeftPanel() {
  return (
    <div className="flex h-full shrink-0" aria-label="Controls panel">
      {/* Black sidebar — silent power */}
      <div className="w-10 bg-sidebar shrink-0" />

      {/* Controls — pure white, zero noise */}
      <aside className="w-[220px] shrink-0 bg-surface overflow-y-auto" style={{ borderRight: '0.5px solid #E0E0DC' }}>
        <div className="px-6 pt-10 pb-16 space-y-12">
          {/* Masthead */}
          <header className="space-y-0.5">
            <p className="font-editorial text-[15px] uppercase tracking-[0.12em] leading-none text-ink">
              Banner Studio
            </p>
            <p className="font-editorial text-[11px] uppercase tracking-[0.12em] leading-none text-secondary">
              SharkNinja
            </p>
          </header>

          <div className="h-px bg-ink" />

          <ImageUpload />

          <div className="h-px bg-ink" />

          <FontManager />

          <div className="h-px bg-ink" />

          <TextInputs />

          <div className="h-px bg-ink" />

          <BadgeLibrary />

          <div className="h-px bg-ink" />

          <BrandSettings />
        </div>
      </aside>
    </div>
  )
}
