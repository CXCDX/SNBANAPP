import { useCallback, useEffect } from 'react'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { saveFont, getAllFonts, deleteFont } from '../utils/indexedDB'

export default function FontManager() {
  const { customFonts } = useAppState()
  const dispatch = useAppDispatch()

  // Load fonts from IndexedDB on mount
  useEffect(() => {
    getAllFonts().then(async (fonts) => {
      if (!fonts || fonts.length === 0) return
      const loaded = []
      for (const font of fonts) {
        try {
          const fontFace = new FontFace(font.name, font.data)
          await fontFace.load()
          document.fonts.add(fontFace)
          loaded.push({ name: font.name })
        } catch (err) {
          console.error(`Failed to load font "${font.name}" from IndexedDB:`, err)
        }
      }
      if (loaded.length > 0) {
        dispatch({ type: 'SET_CUSTOM_FONTS', payload: loaded })
      }
    }).catch(() => {})
  }, [dispatch])

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
        dispatch({ type: 'ADD_CUSTOM_FONT', payload: { name } })
        // Store in IndexedDB (ArrayBuffer)
        await saveFont({ name, data: reader.result }).catch(() => {})
        dispatch({ type: 'ADD_TOAST', payload: { message: `Font "${name}" loaded`, variant: 'success' } })
      } catch (err) {
        console.error('Font load failed:', err)
        dispatch({ type: 'ADD_TOAST', payload: { message: `Failed to load font`, variant: 'error' } })
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }, [dispatch])

  const handleRemove = async (fontName) => {
    dispatch({ type: 'REMOVE_CUSTOM_FONT', payload: fontName })
    await deleteFont(fontName).catch(() => {})
  }

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
                onClick={() => handleRemove(font.name)}
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
