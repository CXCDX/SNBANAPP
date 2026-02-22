import { useAppState, useAppDispatch } from '../store/AppContext'
import { AD_FORMATS } from '../utils/formats'
import BannerCanvas from './BannerCanvas'

export default function ExpandedPreview() {
  const { expandedFormat } = useAppState()
  const dispatch = useAppDispatch()

  if (!expandedFormat) return null

  const format = AD_FORMATS.find(f => f.id === expandedFormat)
  if (!format) return null

  const maxW = window.innerWidth * 0.8
  const maxH = window.innerHeight * 0.8
  const scaleW = maxW / format.width
  const scaleH = maxH / format.height
  const scale = Math.min(scaleW, scaleH, 1)

  return (
    <div
      className="fixed inset-0 z-40 bg-bg/95 flex items-center justify-center"
      onClick={() => dispatch({ type: 'SET_EXPANDED_FORMAT', payload: null })}
      role="dialog"
      aria-modal="true"
      aria-label={`Expanded preview of ${format.name}`}
    >
      <div
        className="relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-[16px] font-editorial text-ink">{format.name}</h2>
            <p className="text-[11px] font-mono text-secondary">{format.width} &times; {format.height}</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_EXPANDED_FORMAT', payload: null })}
            className="text-[11px] font-mono text-secondary hover:text-ink hover:underline bg-transparent border-none cursor-pointer"
            aria-label="Close expanded preview"
          >
            Close
          </button>
        </div>
        <div>
          <BannerCanvas format={format} scale={scale} />
        </div>
      </div>
    </div>
  )
}
