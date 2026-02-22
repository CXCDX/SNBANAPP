import ExportPanel from './ExportPanel'

export default function RightPanel() {
  return (
    <aside
      className="w-[280px] shrink-0 bg-surface overflow-y-auto"
      style={{ borderLeft: '0.5px solid #E0E0DC' }}
      aria-label="Formats and export panel"
    >
      <div className="px-6 pt-10 pb-16">
        <ExportPanel />
      </div>
    </aside>
  )
}
