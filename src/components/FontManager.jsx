import { useCallback } from 'react'
import { useAppState, useAppDispatch } from '../store/AppContext'

export default function FontManager() {
  const { customFonts } = useAppState()
  const dispatch = useAppDispatch()

  const handleUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const name = file.name.replace(/\.\w+$/, '').replace(/[-_]/g, ' ')
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const fontFace = new FontFace(name, reader.result)
        await fontFace.load()
        document.fonts.add(fontFace)
        dispatch({ type: 'ADD_CUSTOM_FONT', payload: { name, src: reader.result } })
        dispatch({ type: 'ADD_TOAST', payload: { message: `Font "${name}" loaded`, variant: 'success' } })
      } catch (err) {
        console.error('Font load failed:', err)
        dispatch({ type: 'ADD_TOAST', payload: { message: `Failed to load font`, variant: 'error' } })
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }, [dispatch])

  return (
    <div className="space-y-2">
      <h3 className="font-editorial text-[11px] uppercase tracking-[0.08em] text-ink">
        Fonts
      </h3>

      <label className="block cursor-pointer">
        <span className="text-[10px] font-mono text-secondary hover:underline">Upload TTF / OTF / WOFF</span>
        <input
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          onChange={handleUpload}
          className="hidden"
          aria-label="Upload custom font file"
        />
      </label>

      {customFonts.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9px] font-mono text-secondary">Uploaded</p>
          {customFonts.map((font) => (
            <div key={font.name} className="flex items-center justify-between gap-1">
              <span
                className="text-[10px] text-ink truncate"
                style={{ fontFamily: `"${font.name}", sans-serif` }}
              >
                {font.name}
              </span>
              <button
                onClick={() => dispatch({ type: 'REMOVE_CUSTOM_FONT', payload: font.name })}
                className="text-[9px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer p-0 shrink-0"
                aria-label={`Remove font ${font.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
