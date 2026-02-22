import { useState } from 'react'
import TextInputs from './TextInputs'
import LogoSelector from './LogoSelector'
import BadgeLibrary from './BadgeLibrary'
import FontManager from './FontManager'
import CsvBulkUpload from './CsvBulkUpload'

function CollapsibleSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 bg-transparent border-none cursor-pointer p-0 py-1"
        aria-expanded={open}
        aria-label={`${open ? 'Collapse' : 'Expand'} ${title} section`}
      >
        <span
          className="text-secondary transition-transform duration-200 inline-block"
          style={{
            fontSize: '8px',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        >
          ▼
        </span>
        <span
          className="text-ink uppercase"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '12px',
            letterSpacing: '0.1em',
          }}
        >
          {title}
        </span>
      </button>
      <div className={`section-collapse ${open ? '' : 'collapsed'}`}>
        <div>
          <div className="pt-2 pb-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LeftPanel() {
  return (
    <div className="flex h-full shrink-0" aria-label="Controls panel">
      {/* Black sidebar */}
      <div className="w-10 bg-sidebar shrink-0" />

      {/* Controls */}
      <aside className="w-[480px] shrink-0 bg-surface overflow-y-auto" style={{ borderRight: '0.5px solid #E0E0DC' }}>
        <div className="px-4 pt-5 pb-8 space-y-4">
          {/* Masthead */}
          <header style={{ paddingLeft: '20px', paddingTop: '20px' }}>
            <p
              className="uppercase leading-none text-ink"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '18px', fontWeight: 600, letterSpacing: '0.05em' }}
            >
              BANNER STUDIO
            </p>
            <p
              className="uppercase leading-none text-secondary"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', marginTop: '4px' }}
            >
              SHARKNINJA
            </p>
          </header>

          <div className="h-px bg-border" />

          <CollapsibleSection title="Text" defaultOpen={true}>
            <TextInputs />
          </CollapsibleSection>

          <div className="h-px bg-border" />

          <CollapsibleSection title="Fonts" defaultOpen={false}>
            <FontManager />
          </CollapsibleSection>

          <div className="h-px bg-border" />

          <CollapsibleSection title="Badges" defaultOpen={false}>
            <BadgeLibrary />
          </CollapsibleSection>

          <div className="h-px bg-border" />

          <CollapsibleSection title="Brand" defaultOpen={false}>
            <LogoSelector />
            <div className="mt-4">
              <CsvBulkUpload />
            </div>
          </CollapsibleSection>
        </div>
      </aside>
    </div>
  )
}
