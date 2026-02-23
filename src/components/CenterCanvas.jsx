import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { AD_FORMATS } from '../utils/formats'
import { getImageLuminance } from '../utils/luminance'
import { renderBannerCanvas, prepareRenderParams } from '../utils/renderCanvas'
import BannerCanvas from './BannerCanvas'
import EditModeBannerCanvas from './EditModeBannerCanvas'


// Group formats by platform for the tab bar
const PLATFORMS = [...new Set(AD_FORMATS.map(f => f.platform))]

export default function CenterCanvas() {
  const state = useAppState()
  const { selectedFormat, image, editingFormat } = state
  const dispatch = useAppDispatch()
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })
  const [activePlatform, setActivePlatform] = useState('instagram')
  const [isDragOver, setIsDragOver] = useState(false)
  const [savedState, setSavedState] = useState(null)
  const [isSharing, setIsSharing] = useState(false)
  const fileInputRef = useRef(null)

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

  const isEditMode = editingFormat === format.id

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

  // Smart scaling
  const margin = 40
  const tabBarHeight = 120
  const editBarHeight = isEditMode ? 36 : 0
  const availW = containerSize.width - margin * 2
  const availH = containerSize.height - tabBarHeight - margin * 2 - editBarHeight

  const scaleW = availW / format.width
  const scaleH = availH / format.height
  let scale = Math.min(scaleW, scaleH)
  const shortestSide = Math.min(format.width, format.height) * scale
  if (shortestSide < 400 && Math.min(format.width, format.height) > 0) {
    const minScale = 400 / Math.min(format.width, format.height)
    scale = Math.max(scale, minScale)
  }
  scale = Math.min(scale, scaleW, scaleH)

  // Image upload handlers
  const processFile = useCallback((file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const luminance = getImageLuminance(img)
        dispatch({
          type: 'SET_IMAGE',
          payload: { src: reader.result, name: file.name, width: img.width, height: img.height, luminance },
        })
        const formatKeys = AD_FORMATS.map(f => `${f.width}x${f.height}`)
        dispatch({ type: 'INIT_FOCUS_POINTS', payload: formatKeys })
        dispatch({ type: 'ADD_TOAST', payload: { message: `Loaded: ${file.name}`, variant: 'success' } })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }, [dispatch])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file && /\.(png|jpe?g|webp)$/i.test(file.name)) {
      processFile(file)
    }
  }, [processFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleCanvasClick = useCallback(() => {
    if (!image) {
      fileInputRef.current?.click()
    }
  }, [image])

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }, [processFile])

  const handleRemoveImage = useCallback((e) => {
    e.stopPropagation()
    dispatch({ type: 'CLEAR_IMAGE' })
  }, [dispatch])

  // Edit mode handlers
  const handleEnterEditMode = useCallback(() => {
    // Save snapshot for cancel
    const { history, historyIndex, toasts, isExporting, exportProgress, exportCancelled, showDesignPolice, designIssues, showExportModal, ...snap } = state
    setSavedState(snap)
    dispatch({ type: 'SET_EDITING_FORMAT', payload: format.id })
  }, [state, dispatch, format])

  const handleSave = useCallback(() => {
    dispatch({ type: 'SET_EDITING_FORMAT', payload: null })
    setSavedState(null)
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Changes saved', variant: 'success' } })
  }, [dispatch])

  const handleCancel = useCallback(() => {
    if (savedState) {
      dispatch({ type: 'RESTORE_STATE', payload: savedState })
    }
    dispatch({ type: 'SET_EDITING_FORMAT', payload: null })
    setSavedState(null)
  }, [savedState, dispatch])

  // Share Preview handler
  const handleSharePreview = useCallback(async () => {
    if (!image) {
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Önce bir görsel yükleyin', variant: 'error' } })
      return
    }
    setIsSharing(true)
    try {
      const params = await prepareRenderParams(state)
      const thumbnails = {}
      for (const fmt of AD_FORMATS) {
        try {
          const canvas = renderBannerCanvas({ format: fmt, state, ...params })
          thumbnails[fmt.id] = canvas.toDataURL('image/jpeg', 0.5)
        } catch { /* skip failed format */ }
      }
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
      const brandPrefix = state.logoType === 'shark' ? 'Shark' : state.logoType === 'ninja' ? 'Ninja' : 'SharkNinja'
      const previewData = {
        id,
        brand: brandPrefix,
        date: new Date().toISOString(),
        thumbnails,
        feedback: null,
      }
      localStorage.setItem(`banner-preview-${id}`, JSON.stringify(previewData))
      const url = `${window.location.origin}${window.location.pathname}#/preview/${id}`
      await navigator.clipboard.writeText(url)
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Link kopyalandı', variant: 'success' } })
    } catch (err) {
      console.error('Share preview failed:', err)
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Paylaşım başarısız', variant: 'error' } })
    } finally {
      setIsSharing(false)
    }
  }, [state, image, dispatch])

  // Escape key to exit edit mode
  useEffect(() => {
    if (!isEditMode) return
    const handler = (e) => {
      if (e.key === 'Escape') handleCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isEditMode, handleCancel])

  return (
    <main
      id="canvas-container"
      className="flex-1 flex flex-col items-center justify-center dot-grid min-h-0 overflow-hidden"
      style={{ background: '#F0F0EC' }}
      aria-label="Banner preview area"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Top bar with platform tabs + share button */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex gap-4">
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
        <div className="flex-1" />
        <button
          onClick={handleSharePreview}
          disabled={isSharing || !image}
          className="font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-1.5 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'transparent', color: '#0A0A0A', border: '1px solid #E0E0DC' }}
        >
          {isSharing ? 'Hazırlanıyor...' : 'Share Preview'}
        </button>
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

      {/* Edit mode bar */}
      {isEditMode && (
        <div
          className="flex items-center justify-between w-full px-6 mb-2"
          style={{
            height: '36px',
            background: '#FAFAF8',
            borderBottom: '1px solid #E0E0DC',
            maxWidth: `${format.width * scale + 40}px`,
          }}
        >
          <span className="text-[11px] font-mono text-secondary">
            EDIT MODE — double-click text to edit, drag to reposition, click background to set focus point
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="text-[11px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-[11px] font-mono px-3 py-1 bg-ink text-bg cursor-pointer hover:bg-bg hover:text-ink transition-all"
              style={{ border: '1px solid #0A0A0A' }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        style={{
          boxShadow: '0 4px 40px rgba(0,0,0,0.06)',
          cursor: !image ? 'pointer' : isEditMode ? 'default' : 'pointer',
          outline: isEditMode ? '2px solid #00C4FF' : isDragOver ? '2px dashed #00C4FF' : 'none',
          outlineOffset: '2px',
          position: 'relative',
        }}
        onClick={!image ? handleCanvasClick : undefined}
        onDoubleClick={!isEditMode && image ? handleEnterEditMode : undefined}
        title={!image ? 'Click to upload image' : isEditMode ? '' : 'Double-click to edit'}
      >
        {/* Empty state overlay for drop */}
        {!image && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '20px',
              color: '#9A9A9A',
              fontStyle: 'italic',
            }}>
              Drop image here
            </p>
          </div>
        )}

        {isEditMode ? (
          <EditModeBannerCanvas format={format} scale={scale} />
        ) : (
          <BannerCanvas format={format} scale={scale} />
        )}
      </div>

      {/* Below canvas: format label + remove link */}
      <div className="mt-4 text-center" style={{ position: 'relative' }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, color: '#0A0A0A' }}>
          {format.name}
        </p>
        <p className="font-mono mt-0.5" style={{ fontSize: '12px', color: '#555555' }}>
          {format.width} &times; {format.height}
          {image && ` / ${Math.round(scale * 100)}%`}
        </p>
        {!isEditMode && (
          <button
            onClick={handleEnterEditMode}
            className="hover:underline bg-transparent border-none cursor-pointer mt-1"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#0A0A0A' }}
          >
            Edit in canvas
          </button>
        )}
      </div>

      {/* Remove image link — bottom-left of canvas */}
      {image && !isEditMode && (
        <div style={{ position: 'absolute', bottom: '20px', left: '20px' }}>
          <button
            onClick={handleRemoveImage}
            className="bg-transparent border-none cursor-pointer p-0 hover:text-ink"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '11px',
              color: '#9A9A9A',
            }}
          >
            × Remove
          </button>
        </div>
      )}
    </main>
  )
}
