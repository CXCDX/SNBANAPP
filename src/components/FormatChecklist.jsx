import { useAppDispatch } from '../store/AppContext'
import { AD_FORMATS, getPlatformLabel } from '../utils/formats'
import BannerCanvas from './BannerCanvas'

const PLATFORM_ORDER = ['instagram', 'social', 'google', 'sharkninja', 'trendyol', 'hepsiburada', 'amazon_tr']

// Extreme aspect ratio: > 4:1 is "very wide"
function isVeryWide(f) { return f.width / f.height > 4 }
function isVeryTall(f) { return f.height / f.width > 3 }

function getCardScale(format) {
  const maxW = 160
  const maxH = 120
  const scaleW = maxW / format.width
  const scaleH = maxH / format.height
  let scale = Math.min(scaleW, scaleH)
  // Very wide formats: special min zoom
  if (format.id === 'ty-kapak-web') {
    scale = Math.max(scale, 4 * (maxW / format.width))
  }
  return scale
}

function getWideCardScale(format) {
  const maxW = 480
  const maxH = 80
  const scaleW = maxW / format.width
  const scaleH = maxH / format.height
  let scale = Math.min(scaleW, scaleH)
  if (format.id === 'ty-kapak-web') {
    scale = Math.max(scale, 4 * (maxW / format.width))
  }
  return scale
}

// Marketplace platforms that get per-section All/None
const MARKETPLACE_PLATFORMS = ['trendyol', 'hepsiburada', 'amazon_tr']

export default function FormatChecklist({ enabledFormats, onToggle }) {
  const dispatch = useAppDispatch()
  const platforms = PLATFORM_ORDER.filter(p => AD_FORMATS.some(f => f.platform === p))

  const toggleAllInPlatform = (platform, enable) => {
    const ids = AD_FORMATS.filter(f => f.platform === platform).map(f => f.id)
    ids.forEach(id => {
      const isEnabled = enabledFormats.includes(id)
      if (enable && !isEnabled) onToggle(id)
      if (!enable && isEnabled) onToggle(id)
    })
  }

  return (
    <div className="space-y-4">
      {platforms.map(platform => {
        const formats = AD_FORMATS.filter(f => f.platform === platform)
        const hasMarketplaceToggle = MARKETPLACE_PLATFORMS.includes(platform)

        return (
          <div key={platform}>
            {/* Section header */}
            <div className="flex items-center gap-2 mb-2" style={{ marginTop: '8px', marginBottom: '8px' }}>
              <span
                className="shrink-0"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                  color: '#9A9A9A',
                  textTransform: 'uppercase',
                }}
              >
                {getPlatformLabel(platform)}
              </span>
              <div className="flex-1 h-px" style={{ background: '#E0E0DC' }} />
              {hasMarketplaceToggle && (
                <div className="flex gap-1 shrink-0 text-[11px] font-mono">
                  <button
                    onClick={() => toggleAllInPlatform(platform, true)}
                    className="text-ink hover:underline bg-transparent border-none cursor-pointer p-0"
                  >
                    All
                  </button>
                  <span className="text-secondary">/</span>
                  <button
                    onClick={() => toggleAllInPlatform(platform, false)}
                    className="text-secondary hover:underline bg-transparent border-none cursor-pointer p-0"
                  >
                    None
                  </button>
                </div>
              )}
            </div>

            {/* Format cards grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: formats.some(f => isVeryWide(f))
                  ? '1fr'
                  : 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              {formats.map(f => {
                const wide = isVeryWide(f)
                const tall = isVeryTall(f)
                const scale = wide ? getWideCardScale(f) : getCardScale(f)
                const cardW = f.width * scale
                const cardH = Math.min(f.height * scale, tall ? 300 : f.height * scale)

                return (
                  <div
                    key={f.id}
                    style={{
                      gridColumn: wide ? '1 / -1' : undefined,
                    }}
                  >
                    <label className="flex flex-col cursor-pointer group">
                      <div className="flex items-start gap-1.5 mb-1">
                        <input
                          type="checkbox"
                          checked={enabledFormats.includes(f.id)}
                          onChange={() => onToggle(f.id)}
                          className="checkbox-editorial mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '13px',
                            color: '#0A0A0A',
                          }} className="truncate group-hover:underline">
                            {f.name}
                          </p>
                          <p style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: '11px',
                            color: '#9A9A9A',
                          }}>
                            {f.width}&times;{f.height}
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Thumbnail preview */}
                    <div
                      className="overflow-hidden"
                      style={{
                        width: `${cardW}px`,
                        height: `${cardH}px`,
                        maxWidth: '100%',
                      }}
                    >
                      <BannerCanvas format={f} scale={scale} />
                    </div>

                    {/* Warning for extreme aspect ratios */}
                    {f.id === 'ty-kapak-web' && (
                      <p style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '10px',
                        color: '#FF8800',
                        marginTop: '2px',
                      }}>
                        Çok dar format — metni küçük ve merkeze yakın tut.
                      </p>
                    )}

                    {/* Edit in canvas link */}
                    <button
                      onClick={() => {
                        dispatch({ type: 'SET_SELECTED_FORMAT', payload: f.id })
                        dispatch({ type: 'SET_EDITING_FORMAT', payload: f.id })
                      }}
                      className="bg-transparent border-none cursor-pointer p-0 hover:underline"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '11px',
                        color: '#0A0A0A',
                        marginTop: '2px',
                      }}
                    >
                      Edit in canvas
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
