import { useAppState, useAppDispatch } from '../store/AppContext'

export default function DesignPoliceModal({ onExportAnyway }) {
  const { designIssues, showDesignPolice } = useAppState()
  const dispatch = useAppDispatch()

  if (!showDesignPolice || designIssues.length === 0) return null

  const errors = designIssues.filter(i => i.level === 'error')
  const warnings = designIssues.filter(i => i.level === 'warning')
  const passes = designIssues.filter(i => i.level === 'pass')
  const hasErrors = errors.length > 0

  const close = () => dispatch({ type: 'SET_SHOW_DESIGN_POLICE', payload: false })

  const fixIssues = () => {
    close()
  }

  const exportAnyway = () => {
    close()
    onExportAnyway?.()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(250,250,248,0.95)' }}
      onClick={close}
    >
      <div
        className="bg-surface w-[360px] max-h-[80vh] overflow-y-auto"
        style={{ border: '1px solid #E0E0DC', boxShadow: '0 4px 40px rgba(0,0,0,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <h2 className="font-editorial text-[14px] text-ink mb-4">Design Review</h2>

          <div className="space-y-2">
            {/* Errors */}
            {errors.map((issue, i) => (
              <div key={`e-${i}`} className="flex items-start gap-2">
                <span className="text-[11px] mt-0.5 shrink-0" style={{ color: '#FF3D57' }}>&#9679;</span>
                <p className="text-[11px] font-mono text-ink">{issue.message}</p>
              </div>
            ))}

            {/* Warnings */}
            {warnings.map((issue, i) => (
              <div key={`w-${i}`} className="flex items-start gap-2">
                <span className="text-[11px] mt-0.5 shrink-0" style={{ color: '#FFB800' }}>&#9679;</span>
                <p className="text-[11px] font-mono text-ink">{issue.message}</p>
              </div>
            ))}

            {/* Passes */}
            {passes.map((issue, i) => (
              <div key={`p-${i}`} className="flex items-start gap-2">
                <span className="text-[11px] mt-0.5 shrink-0" style={{ color: '#2DD881' }}>&#10003;</span>
                <p className="text-[11px] font-mono text-secondary">{issue.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 flex gap-2">
          {hasErrors && (
            <button
              onClick={fixIssues}
              className="flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.1em] cursor-pointer transition-all"
              style={{
                background: 'transparent',
                color: '#FF3D57',
                border: '1px solid #FF3D57',
              }}
            >
              Fix Issues
            </button>
          )}
          <button
            onClick={exportAnyway}
            className="flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.1em] bg-ink text-bg cursor-pointer transition-all hover:bg-bg hover:text-ink"
            style={{ border: '1px solid #0A0A0A' }}
          >
            Export Anyway
          </button>
        </div>
      </div>
    </div>
  )
}
