import { useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { saveCustomLogo, getCustomLogo, deleteCustomLogo } from '../utils/indexedDB'

const POSITIONS = [
  { id: 'top-left', label: 'TL' },
  { id: 'top-right', label: 'TR' },
  { id: 'bottom-left', label: 'BL' },
  { id: 'bottom-right', label: 'BR' },
]

// Inline SVG logos
const SHARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" fill="none"><text x="0" y="32" font-family="Barlow Condensed,sans-serif" font-weight="700" font-size="32" fill="#0A0A0A" letter-spacing="3">SHARK</text></svg>`
const NINJA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" fill="none"><text x="0" y="32" font-family="Barlow Condensed,sans-serif" font-weight="700" font-size="32" fill="#0A0A0A" letter-spacing="3">NINJA</text></svg>`

function svgToDataURL(svg) {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

export default function LogoSelector() {
  const { logoType, logoPosition, logoSize, logo, brandColor } = useAppState()
  const dispatch = useAppDispatch()

  // Load custom logo from IndexedDB on mount
  useEffect(() => {
    getCustomLogo().then(stored => {
      if (stored && stored.src && logoType === 'custom') {
        dispatch({ type: 'SET_LOGO', payload: stored.src })
      }
    }).catch(() => {})
  }, [])

  const setLogoType = (type) => {
    dispatch({ type: 'SET_LOGO_TYPE', payload: type })
    if (type === 'shark') {
      dispatch({ type: 'SET_LOGO', payload: svgToDataURL(SHARK_SVG) })
    } else if (type === 'ninja') {
      dispatch({ type: 'SET_LOGO', payload: svgToDataURL(NINJA_SVG) })
    } else {
      // custom — try to load from IndexedDB
      getCustomLogo().then(stored => {
        dispatch({ type: 'SET_LOGO', payload: stored?.src || null })
      }).catch(() => dispatch({ type: 'SET_LOGO', payload: null }))
    }
  }

  const onDropLogo = useCallback((files) => {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      dispatch({ type: 'SET_LOGO', payload: reader.result })
      dispatch({ type: 'SET_LOGO_TYPE', payload: 'custom' })
      saveCustomLogo({ id: 'custom-logo', src: reader.result }).catch(() => {})
    }
    reader.readAsDataURL(file)
  }, [dispatch])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: onDropLogo,
    accept: { 'image/*': ['.png', '.svg', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    multiple: false,
  })

  const removeLogo = () => {
    dispatch({ type: 'SET_LOGO', payload: null })
    deleteCustomLogo('custom-logo').catch(() => {})
  }

  return (
    <div className="space-y-3">

      {/* Type toggle */}
      <div className="flex gap-1">
        {['shark', 'ninja', 'custom'].map(type => (
          <button
            key={type}
            onClick={() => setLogoType(type)}
            className="text-[11px] font-mono uppercase tracking-[0.08em] px-2 py-1 cursor-pointer transition-all"
            style={{
              background: logoType === type ? '#0A0A0A' : 'transparent',
              color: logoType === type ? '#FAFAF8' : '#999994',
              border: '1px solid ' + (logoType === type ? '#0A0A0A' : '#E0E0DC'),
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Custom upload */}
      {logoType === 'custom' && (
        <div className="space-y-1">
          <div {...getRootProps()} className="cursor-pointer">
            <input {...getInputProps()} aria-label="Upload custom logo" />
            {logo ? (
              <div className="flex items-center gap-2">
                <img src={logo} alt="Logo" className="h-5 w-auto object-contain" />
                <span className="text-[11px] font-mono text-secondary hover:underline">Replace</span>
              </div>
            ) : (
              <p className="text-[11px] font-mono text-secondary hover:underline">Upload PNG</p>
            )}
          </div>
          {logo && (
            <button
              onClick={removeLogo}
              className="text-[11px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer p-0"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {/* Position */}
      <div className="space-y-1">
        <p className="text-[11px] font-mono text-secondary">Position</p>
        <div className="grid grid-cols-4 gap-1">
          {POSITIONS.map(pos => (
            <button
              key={pos.id}
              onClick={() => dispatch({ type: 'SET_LOGO_POSITION', payload: pos.id })}
              className="text-[11px] font-mono py-1 cursor-pointer transition-all text-center"
              style={{
                background: logoPosition === pos.id ? '#0A0A0A' : 'transparent',
                color: logoPosition === pos.id ? '#FAFAF8' : '#999994',
                border: '1px solid ' + (logoPosition === pos.id ? '#0A0A0A' : '#E0E0DC'),
              }}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size slider */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <p className="text-[11px] font-mono text-secondary">Size</p>
          <p className="text-[11px] font-mono text-secondary">{logoSize}px</p>
        </div>
        <input
          type="range"
          min="40"
          max="200"
          value={logoSize}
          onChange={(e) => dispatch({ type: 'SET_LOGO_SIZE', payload: Number(e.target.value) })}
          className="w-full h-1 appearance-none bg-border cursor-pointer"
          style={{ accentColor: '#0A0A0A' }}
        />
      </div>

      {/* Brand color */}
      <div className="space-y-1">
        <p className="text-[11px] font-mono text-secondary">Brand Color</p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={brandColor}
            onChange={(e) => dispatch({ type: 'SET_BRAND_COLOR', payload: e.target.value })}
            className="w-4 h-4"
          />
          <span className="text-[11px] font-mono text-secondary">{brandColor}</span>
        </div>
      </div>
    </div>
  )
}
