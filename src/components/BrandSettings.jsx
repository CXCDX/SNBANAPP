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
      <h3 className="font-editorial text-[11px] uppercase tracking-[0.08em] text-ink">
        Brand
      </h3>

      {/* Logo */}
      <div className="space-y-1">
        <label className="text-[11px] font-mono text-ink">
          Logo
        </label>
        <div
          {...getRootProps()}
          className="cursor-pointer"
          role="button"
          aria-label="Upload brand logo"
        >
          <input {...getInputProps()} aria-label="File input for brand logo" />
          {logo ? (
            <div className="flex items-center gap-2">
              <img src={logo} alt="Brand logo" className="h-5 w-auto object-contain" />
              <span className="text-[11px] font-mono text-secondary hover:underline">Replace</span>
            </div>
          ) : (
            <p className="text-[11px] font-mono text-secondary hover:underline">Upload logo</p>
          )}
        </div>
        {logo && (
          <button
            onClick={() => dispatch({ type: 'SET_LOGO', payload: null })}
            className="text-[11px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer p-0"
            aria-label="Remove logo"
          >
            Remove
          </button>
        )}
      </div>

      {/* Brand color */}
      <div className="space-y-1">
        <label className="text-[11px] font-mono text-ink">
          Color
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={brandColor}
            onChange={(e) => dispatch({ type: 'SET_BRAND_COLOR', payload: e.target.value })}
            className="w-5 h-5"
            aria-label="Brand primary color picker"
          />
          <span className="text-[11px] font-mono text-secondary">{brandColor}</span>
        </div>
      </div>
    </div>
  )
}
