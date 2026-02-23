import { useAppState, useAppDispatch } from '../store/AppContext'

const CATEGORY_LABELS = {
  text: 'Metin & Kopya',
  visual: 'Görsel & Düzen',
  brand: 'Marka Uyumu',
}

const LEVEL_COLORS = {
  error: '#FF3D57',
  warning: '#FFB800',
  pass: '#2DD881',
}

const LEVEL_ICONS = {
  error: '\u2716',
  warning: '\u26A0',
  pass: '\u2713',
}

export default function DesignPoliceModal({ onExportAnyway }) {
  const { designIssues, showDesignPolice } = useAppState()
  const dispatch = useAppDispatch()

  if (!showDesignPolice || designIssues.length === 0) return null

  const errors = designIssues.filter(i => i.level === 'error')
  const warnings = designIssues.filter(i => i.level === 'warning')
  const passes = designIssues.filter(i => i.level === 'pass')
  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0

  // Group by category
  const categories = ['text', 'visual', 'brand']
  const grouped = {}
  categories.forEach(cat => {
    grouped[cat] = designIssues.filter(i => i.category === cat)
  })

  const close = () => dispatch({ type: 'SET_SHOW_DESIGN_POLICE', payload: false })

  const fixIssues = () => {
    close()
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'controls' })
  }

  const exportAnyway = () => {
    close()
    onExportAnyway?.()
  }

  // Score: percentage of passing checks
  const total = designIssues.length
  const passCount = passes.length
  const score = total > 0 ? Math.round((passCount / total) * 100) : 0

  const scoreColor = score >= 80 ? '#2DD881' : score >= 50 ? '#FFB800' : '#FF3D57'

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center"
      style={{ background: 'rgba(250,250,248,0.95)' }}
      onClick={close}
    >
      <div
        className="bg-surface w-[440px] max-h-[85vh] overflow-y-auto"
        style={{ border: '1px solid #E0E0DC', boxShadow: '0 4px 40px rgba(0,0,0,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #E0E0DC' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>
              Tasarım Kontrolü
            </h2>
            <button
              onClick={close}
              className="text-secondary hover:text-ink bg-transparent border-none cursor-pointer"
              style={{ fontSize: '18px', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>

          {/* Score bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-border rounded-sm overflow-hidden">
              <div
                className="h-2 transition-all duration-500"
                style={{ width: `${score}%`, background: scoreColor }}
              />
            </div>
            <span className="text-[12px] font-mono" style={{ color: scoreColor, fontWeight: 600 }}>
              {score}%
            </span>
          </div>

          <div className="flex gap-3 mt-2">
            {errors.length > 0 && (
              <span className="text-[11px] font-mono" style={{ color: LEVEL_COLORS.error }}>
                {errors.length} hata
              </span>
            )}
            {warnings.length > 0 && (
              <span className="text-[11px] font-mono" style={{ color: LEVEL_COLORS.warning }}>
                {warnings.length} uyarı
              </span>
            )}
            {passes.length > 0 && (
              <span className="text-[11px] font-mono" style={{ color: LEVEL_COLORS.pass }}>
                {passes.length} geçti
              </span>
            )}
          </div>
        </div>

        {/* Warning banner */}
        {(hasErrors || hasWarnings) && (
          <div
            className="mx-6 mt-4 px-4 py-3 text-[12px] font-mono"
            style={{
              background: hasErrors ? 'rgba(255,61,87,0.08)' : 'rgba(255,184,0,0.08)',
              border: `1px solid ${hasErrors ? LEVEL_COLORS.error : LEVEL_COLORS.warning}`,
              color: '#0A0A0A',
            }}
          >
            Tasarım uyarıları var. Yine de export al?
          </div>
        )}

        {/* Category sections */}
        <div className="px-6 py-4 space-y-4">
          {categories.map(cat => {
            const items = grouped[cat]
            if (!items || items.length === 0) return null

            const catErrors = items.filter(i => i.level === 'error')
            const catWarnings = items.filter(i => i.level === 'warning')
            const catPasses = items.filter(i => i.level === 'pass')

            const sectionColor = catErrors.length > 0 ? LEVEL_COLORS.error
              : catWarnings.length > 0 ? LEVEL_COLORS.warning
              : LEVEL_COLORS.pass

            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: sectionColor }} />
                  <p className="text-[11px] font-mono text-ink uppercase tracking-[0.1em]">
                    {CATEGORY_LABELS[cat]}
                  </p>
                </div>

                <div className="space-y-1.5 ml-4">
                  {catErrors.map((issue, i) => (
                    <div key={`e-${i}`} className="flex items-start gap-2">
                      <span className="text-[11px] mt-0.5 shrink-0" style={{ color: LEVEL_COLORS.error }}>
                        {LEVEL_ICONS.error}
                      </span>
                      <div>
                        <p className="text-[11px] font-mono text-ink">{issue.message}</p>
                        {issue.code && <span className="text-[11px] font-mono text-secondary">{issue.code}</span>}
                      </div>
                    </div>
                  ))}

                  {catWarnings.map((issue, i) => (
                    <div key={`w-${i}`} className="flex items-start gap-2">
                      <span className="text-[11px] mt-0.5 shrink-0" style={{ color: LEVEL_COLORS.warning }}>
                        {LEVEL_ICONS.warning}
                      </span>
                      <div>
                        <p className="text-[11px] font-mono text-ink">{issue.message}</p>
                        {issue.code && <span className="text-[11px] font-mono text-secondary">{issue.code}</span>}
                      </div>
                    </div>
                  ))}

                  {catPasses.map((issue, i) => (
                    <div key={`p-${i}`} className="flex items-start gap-2">
                      <span className="text-[11px] mt-0.5 shrink-0" style={{ color: LEVEL_COLORS.pass }}>
                        {LEVEL_ICONS.pass}
                      </span>
                      <p className="text-[11px] font-mono text-secondary">{issue.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 pt-2 flex gap-2" style={{ borderTop: '1px solid #E0E0DC' }}>
          {(hasErrors || hasWarnings) && (
            <button
              onClick={fixIssues}
              className="flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.1em] cursor-pointer transition-all hover:opacity-80"
              style={{
                background: 'transparent',
                color: hasErrors ? LEVEL_COLORS.error : LEVEL_COLORS.warning,
                border: `1px solid ${hasErrors ? LEVEL_COLORS.error : LEVEL_COLORS.warning}`,
              }}
            >
              Düzelt
            </button>
          )}
          <button
            onClick={exportAnyway}
            className="flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.1em] bg-ink text-bg cursor-pointer transition-all hover:bg-bg hover:text-ink"
            style={{ border: '1px solid #0A0A0A' }}
          >
            Yine de Al
          </button>
        </div>
      </div>
    </div>
  )
}
