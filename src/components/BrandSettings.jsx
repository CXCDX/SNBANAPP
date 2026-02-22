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
    <div className="space-y-5">
      <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink">
        Brand
      </h3>

      {/* Logo */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-secondary">
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
            <div className="flex items-center gap-3">
              <img src={logo} alt="Brand logo" className="h-6 w-auto object-contain" />
              <span className="text-[10px] font-mono text-secondary hover:underline">Replace</span>
            </div>
          ) : (
            <p className="text-[10px] font-mono text-secondary hover:underline">Upload logo</p>
          )}
        </div>
        {logo && (
          <button
            onClick={() => dispatch({ type: 'SET_LOGO', payload: null })}
            className="text-[10px] font-mono text-secondary hover:underline"
            aria-label="Remove logo"
          >
            Remove
          </button>
        )}
      </div>

      {/* Brand color */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-secondary">
          Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={brandColor}
            onChange={(e) => dispatch({ type: 'SET_BRAND_COLOR', payload: e.target.value })}
            className="w-6 h-6"
            aria-label="Brand primary color picker"
          />
          <span className="text-[10px] font-mono text-secondary uppercase">{brandColor}</span>
        </div>
      </div>
    </div>
  )
}
