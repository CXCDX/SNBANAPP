import ExportPanel from './ExportPanel'
import PreviewGrid from './PreviewGrid'

export default function RightPanel({ className = '' }) {
  return (
    <aside
      className={`w-70 shrink-0 bg-surface border-l border-border overflow-y-auto ${className}`}
      aria-label="Formats and export panel"
    >
      <div className="p-4 space-y-6">
        <PreviewGrid />

        <div className="h-px bg-border" />

        <ExportPanel />
      </div>
    </aside>
  )
}
