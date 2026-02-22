import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAppState, useAppDispatch } from '../store/AppContext'

export default function BrandSettings() {
  const { logo, brandColor } = useAppState()
  const dispatch = useAppDispatch()

  const onDropLogo = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      dispatch({ type: 'SET_LOGO', payload: reader.result })
    }
    reader.readAsDataURL(file)
  }, [dispatch])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: onDropLogo,
    accept: { 'image/*': ['.png', '.svg', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    multiple: false,
  })

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-heading font-semibold text-text-primary uppercase tracking-wide">
        Brand Settings
      </h3>

      {/* Logo upload */}
      <div className="space-y-1">
        <label className="text-xs font-mono text-text-secondary uppercase tracking-wider">
          Logo
        </label>
        <div
          {...getRootProps()}
          className="border border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-accent/50 transition-colors"
          role="button"
          aria-label="Upload brand logo"
        >
          <input {...getInputProps()} aria-label="File input for brand logo" />
          {logo ? (
            <div className="flex items-center gap-2">
              <img src={logo} alt="Brand logo" className="h-8 w-auto object-contain" />
              <span className="text-xs text-text-secondary">Click to replace</span>
            </div>
          ) : (
            <p className="text-xs text-text-secondary">Drop logo or click</p>
          )}
        </div>
        {logo && (
          <button
            onClick={() => dispatch({ type: 'SET_LOGO', payload: null })}
            className="text-xs text-text-secondary hover:text-danger transition-colors"
            aria-label="Remove logo"
          >
            Remove logo
          </button>
        )}
      </div>

      {/* Brand color */}
      <div className="space-y-1">
        <label className="text-xs font-mono text-text-secondary uppercase tracking-wider">
          Primary Color
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={brandColor}
            onChange={(e) => dispatch({ type: 'SET_BRAND_COLOR', payload: e.target.value })}
            className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
            aria-label="Brand primary color picker"
          />
          <span className="text-xs font-mono text-text-secondary uppercase">{brandColor}</span>
        </div>
      </div>
    </div>
  )
}
