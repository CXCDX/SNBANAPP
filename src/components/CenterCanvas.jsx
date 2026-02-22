import { useMemo, useState, useEffect } from 'react'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { AD_FORMATS } from '../utils/formats'
import BannerCanvas from './BannerCanvas'

// Group formats by platform for the tab bar
const PLATFORMS = [...new Set(AD_FORMATS.map(f => f.platform))]

export default function CenterCanvas() {
  const { selectedFormat, image } = useAppState()
  const dispatch = useAppDispatch()
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })
  const [activePlatform, setActivePlatform] = useState('instagram')

  const platformFormats = useMemo(() => {
    return AD_FORMATS.filter(f => f.platform === activePlatform)
  }, [activePlatform])

  const format = useMemo(() => {
    if (selectedFormat) {
      const found = AD_FORMATS.find(f => f.id === selectedFormat)
      if (found) return found
    }
    return platformFormats[0] || AD_FORMATS[0]
  }, [selectedFormat, platformFormats])

  // Sync active platform when format changes
  useEffect(() => {
    if (format) setActivePlatform(format.platform)
  }, [format])

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

  const sideMargin = 60
  const maxCanvasWidth = 500
  const rawAvailW = containerSize.width - sideMargin * 2
  const availW = Math.min(rawAvailW, maxCanvasWidth)
  const availH = containerSize.height - 200
  const scaleW = availW / format.width
  const scaleH = availH / format.height
  const scale = Math.min(scaleW, scaleH, 1)

  const handleEditFormat = () => {
    dispatch({ type: 'SET_EDITING_FORMAT', payload: format.id })
  }

  return (
    <main
      id="canvas-container"
      className="flex-1 flex flex-col items-center justify-center dot-grid min-h-0 overflow-hidden"
      style={{ padding: `0 ${sideMargin}px` }}
      aria-label="Banner preview area"
    >
      {/* Platform tabs */}
      <div className="flex gap-4 mb-3">
        {PLATFORMS.map(p => (
          <button
            key={p}
            onClick={() => {
              setActivePlatform(p)
              const first = AD_FORMATS.find(f => f.platform === p)
              if (first) dispatch({ type: 'SET_SELECTED_FORMAT', payload: first.id })
            }}
            className="text-[9px] font-mono uppercase tracking-[0.08em] bg-transparent border-none cursor-pointer pb-0.5 transition-all"
            style={{
              color: activePlatform === p ? '#0A0A0A' : '#999994',
              borderBottom: activePlatform === p ? '1px solid #0A0A0A' : '1px solid transparent',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Format tabs within platform */}
      <nav className="flex gap-3 mb-6 flex-wrap justify-center" aria-label="Format selector">
        {platformFormats.map((f) => (
          <button
            key={f.id}
            onClick={() => dispatch({ type: 'SET_SELECTED_FORMAT', payload: f.id })}
            className="text-[9px] font-mono bg-transparent border-none cursor-pointer pb-0.5 transition-all"
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

      {/* Canvas — floating in space */}
      <div
        style={{ boxShadow: '0 4px 40px rgba(0,0,0,0.06)', maxWidth: `${maxCanvasWidth}px`, cursor: 'pointer' }}
        onDoubleClick={handleEditFormat}
        title="Double-click to edit"
      >
        <BannerCanvas format={format} scale={scale} />
      </div>

      {/* Format label */}
      <div className="mt-4 text-center">
        <p className="text-[10px] font-mono text-ink">{format.name}</p>
        <p className="text-[8px] font-mono text-secondary mt-0.5">
          {format.width} &times; {format.height}
          {image && ` / ${Math.round(scale * 100)}%`}
        </p>
        <button
          onClick={handleEditFormat}
          className="text-[8px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer mt-1"
        >
          Edit in canvas
        </button>
      </div>
    </main>
  )
}
