import { useAppState, useAppDispatch } from '../store/AppContext'
import { AD_FORMATS } from '../utils/formats'
import BannerCanvas from './BannerCanvas'

export default function ExpandedPreview() {
  const { expandedFormat } = useAppState()
  const dispatch = useAppDispatch()

  if (!expandedFormat) return null

  const format = AD_FORMATS.find(f => f.id === expandedFormat)
  if (!format) return null

  // Scale to fit viewport (max 80vw / 80vh)
  const maxW = window.innerWidth * 0.8
  const maxH = window.innerHeight * 0.8
  const scaleW = maxW / format.width
  const scaleH = maxH / format.height
  const scale = Math.min(scaleW, scaleH, 1)

  return (
    <div
      className="fixed inset-0 z-40 bg-bg/90 backdrop-blur-sm flex items-center justify-center"
      onClick={() => dispatch({ type: 'SET_EXPANDED_FORMAT', payload: null })}
      role="dialog"
      aria-modal="true"
      aria-label={`Expanded preview of ${format.name}`}
    >
      <div
        className="relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading font-bold text-text-primary">{format.name}</h2>
            <p className="text-xs font-mono text-text-secondary">{format.width}×{format.height}</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_EXPANDED_FORMAT', payload: null })}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
            aria-label="Close expanded preview"
          >
            ✕
          </button>
        </div>
        <div className="rounded-lg overflow-hidden border border-border shadow-2xl">
          <BannerCanvas format={format} scale={scale} />
        </div>
      </div>
    </div>
  )
}
