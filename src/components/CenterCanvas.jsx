import { useMemo, useState, useEffect } from 'react'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { AD_FORMATS } from '../utils/formats'
import BannerCanvas from './BannerCanvas'

export default function CenterCanvas() {
  const { selectedFormat, image } = useAppState()
  const dispatch = useAppDispatch()
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

  const format = useMemo(() => {
    if (selectedFormat) return AD_FORMATS.find(f => f.id === selectedFormat)
    return AD_FORMATS[0]
  }, [selectedFormat])

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

  const padding = 80
  const availW = containerSize.width - padding * 2
  const availH = containerSize.height - padding * 2 - 80
  const scaleW = availW / format.width
  const scaleH = availH / format.height
  const scale = Math.min(scaleW, scaleH, 1)

  return (
    <main
      id="canvas-container"
      className="flex-1 flex flex-col items-center justify-center dot-grid min-h-0 overflow-hidden"
      aria-label="Banner preview area"
    >
      {/* Format tabs — bottom border only on active */}
      <nav className="flex gap-8 mb-10" aria-label="Format selector">
        {AD_FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => dispatch({ type: 'SET_SELECTED_FORMAT', payload: f.id })}
            className="text-[11px] font-mono bg-transparent border-none cursor-pointer pb-1 transition-all duration-200"
            style={{
              color: format.id === f.id ? '#0A0A0A' : '#999994',
              borderBottom: format.id === f.id ? '2px solid #0A0A0A' : '2px solid transparent',
            }}
            aria-label={`Switch to ${f.name} format`}
            aria-pressed={format.id === f.id}
          >
            {f.width}&times;{f.height}
          </button>
        ))}
      </nav>

      {/* Canvas — floating, subtle shadow, NO border */}
      <div style={{ boxShadow: '0 4px 40px rgba(0,0,0,0.06)' }}>
        <BannerCanvas format={format} scale={scale} />
      </div>

      {/* Format label */}
      <div className="mt-6 text-center">
        <p className="font-editorial text-[14px] text-ink">{format.name}</p>
        <p className="text-[10px] font-mono text-secondary mt-1">
          {format.width} &times; {format.height}
          {image && ` / ${Math.round(scale * 100)}%`}
        </p>
      </div>
    </main>
  )
}
