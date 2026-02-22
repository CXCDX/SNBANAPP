import { useMemo, useState, useEffect } from 'react'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { AD_FORMATS } from '../utils/formats'
import BannerCanvas from './BannerCanvas'

export default function CenterCanvas() {
  const { selectedFormat, image } = useAppState()
  const dispatch = useAppDispatch()
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

  // Pick current format or default to Instagram Feed
  const format = useMemo(() => {
    if (selectedFormat) return AD_FORMATS.find(f => f.id === selectedFormat)
    return AD_FORMATS[0]
  }, [selectedFormat])

  // Measure container for responsive scaling
  useEffect(() => {
    const handleResize = () => {
      const el = document.getElementById('canvas-container')
      if (el) {
        setContainerSize({ width: el.clientWidth, height: el.clientHeight })
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate scale to fit within container with breathing room
  const padding = 48
  const availW = containerSize.width - padding * 2
  const availH = containerSize.height - padding * 2 - 60 // account for format tabs
  const scaleW = availW / format.width
  const scaleH = availH / format.height
  const scale = Math.min(scaleW, scaleH, 1)

  return (
    <main
      id="canvas-container"
      className="flex-1 flex flex-col items-center justify-center bg-bg min-h-0 p-6 overflow-hidden"
      aria-label="Banner preview area"
    >
      {/* Format selector tabs */}
      <div className="flex gap-1 mb-4 flex-wrap justify-center">
        {AD_FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => dispatch({ type: 'SET_SELECTED_FORMAT', payload: f.id })}
            className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all duration-200
              ${format.id === f.id
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'text-text-secondary border border-transparent hover:text-text-primary hover:bg-surface'
              }`}
            aria-label={`Switch to ${f.name} format`}
            aria-pressed={format.id === f.id}
          >
            {f.width}×{f.height}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="rounded-lg overflow-hidden border border-border shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <BannerCanvas format={format} scale={scale} />
      </div>

      {/* Format info */}
      <div className="mt-3 text-center">
        <p className="text-sm font-heading font-semibold text-text-primary">{format.name}</p>
        <p className="text-xs font-mono text-text-secondary">
          {format.width}×{format.height}px
          {image && ` — Scale: ${Math.round(scale * 100)}%`}
        </p>
      </div>
    </main>
  )
}
