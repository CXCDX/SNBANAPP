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

  // Smart scaling: fill center, min 400px shortest side
  const margin = 40
  const tabBarHeight = 120
  const availW = containerSize.width - margin * 2
  const availH = containerSize.height - tabBarHeight - margin * 2

  const scaleW = availW / format.width
  const scaleH = availH / format.height
  // Use the smaller scale to fit within container, allow scaling UP
  let scale = Math.min(scaleW, scaleH)
  // Ensure minimum 400px on shortest display side
  const shortestSide = Math.min(format.width, format.height) * scale
  if (shortestSide < 400 && Math.min(format.width, format.height) > 0) {
    const minScale = 400 / Math.min(format.width, format.height)
    scale = Math.max(scale, minScale)
  }
  // But don't overflow the container
  scale = Math.min(scale, scaleW, scaleH)

  const handleEditFormat = () => {
    dispatch({ type: 'SET_EDITING_FORMAT', payload: format.id })
  }

  return (
    <main
      id="canvas-container"
      className="flex-1 flex flex-col items-center justify-center dot-grid min-h-0 overflow-hidden"
      style={{ background: '#F0F0EC' }}
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
            className="font-mono uppercase tracking-[0.08em] bg-transparent border-none cursor-pointer pb-0.5 transition-all"
            style={{
              fontSize: '11px',
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
            className="font-mono bg-transparent border-none cursor-pointer pb-0.5 transition-all"
            style={{
              fontSize: '11px',
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

      {/* Format indicator label — outside canvas */}
      <div className="mb-2">
        <span
          className="inline-block px-3 py-1 font-mono uppercase tracking-[0.08em]"
          style={{
            fontSize: '11px',
            color: '#555555',
            background: '#FFFFFF',
            border: '1px solid #E0E0DC',
          }}
        >
          {format.name}
        </span>
      </div>

      {/* Canvas — floating in space, clean render only */}
      <div
        style={{ boxShadow: '0 4px 40px rgba(0,0,0,0.06)', cursor: 'pointer' }}
        onDoubleClick={handleEditFormat}
        title="Double-click to edit"
      >
        <BannerCanvas format={format} scale={scale} />
      </div>

      {/* Format label */}
      <div className="mt-4 text-center">
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, color: '#0A0A0A' }}>
          {format.name}
        </p>
        <p className="font-mono mt-0.5" style={{ fontSize: '12px', color: '#555555' }}>
          {format.width} &times; {format.height}
          {image && ` / ${Math.round(scale * 100)}%`}
        </p>
        <button
          onClick={handleEditFormat}
          className="hover:underline bg-transparent border-none cursor-pointer mt-1"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#0A0A0A' }}
        >
          Edit in canvas
        </button>
      </div>
    </main>
  )
}
