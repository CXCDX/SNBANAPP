import { useState, useCallback, useRef, useEffect } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { AD_FORMATS, getFormatFolder, getPlatformFolder } from '../utils/formats'
import { getCenterCrop } from '../utils/cropImage'
import { getTextTheme, getOverlayGradient } from '../utils/luminance'
import { runDesignChecks } from '../utils/designPolice'
import { generateHTML5Banner } from '../utils/html5Export'

const PLATFORMS = ['all', ...new Set(AD_FORMATS.map(f => f.platform))]

const ANIM_TYPES = ['Fade', 'Slide', 'Ken Burns', 'Text Pop', 'Loop']
const DURATIONS = ['6s', '15s', '30s']

export default function ExportModal() {
  const state = useAppState()
  const dispatch = useAppDispatch()

  const [selectedFormats, setSelectedFormats] = useState(AD_FORMATS.map(f => f.id))
  const [platformFilter, setPlatformFilter] = useState('all')
  const [exportFormat, setExportFormat] = useState('png')
  const [quality, setQuality] = useState(1.0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(null)
  const [thumbnails, setThumbnails] = useState({})
  const [showVideo, setShowVideo] = useState(false)
  const cancelRef = useRef(false)

  // Generate thumbnails when modal opens
  useEffect(() => {
    if (!state.showExportModal) return
    generateThumbnails()
  }, [state.showExportModal])

  const generateThumbnails = async () => {
    console.log('[ExportModal] generateThumbnails start')
    console.log('[ExportModal] state.image:', state.image ? `${state.image.width}x${state.image.height}` : 'null')
    console.log('[ExportModal] state.headline:', state.headline)
    console.log('[ExportModal] state.tagline:', state.tagline)
    const thumbs = {}
    let bgImg = null
    let logoImg = null
    let badgeImg = null

    try {
      if (state.image) bgImg = await loadImage(state.image.src)
      if (state.logo) logoImg = await loadImage(state.logo)
      if (state.activeBadgeSrc) badgeImg = await loadImage(state.activeBadgeSrc)
    } catch (err) {
      console.error('[ExportModal] Failed to load images for thumbnails:', err)
    }

    const textTheme = state.image ? getTextTheme(state.image.luminance) : 'light'
    const autoColor = textTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
    const overlayGradient = getOverlayGradient(textTheme)
    const hFont = fontStr(state.headlineFont)
    const tFont = fontStr(state.taglineFont)
    const sFont = fontStr(state.subtextFont)
    const cFont = fontStr(state.ctaFont)

    for (const format of AD_FORMATS) {
      try {
        const canvas = renderCanvas({
          format, state, bgImg, logoImg, badgeImg, autoColor, overlayGradient, hFont, tFont, sFont, cFont,
        })
        thumbs[format.id] = canvas.toDataURL('image/jpeg', 0.5)
      } catch (err) {
        console.error(`[ExportModal] Thumbnail failed for ${format.id}:`, err)
        thumbs[format.id] = null
      }
    }
    console.log('[ExportModal] generateThumbnails done, formats:', Object.keys(thumbs).length)
    setThumbnails(thumbs)
  }

  const handleDownload = useCallback(async () => {
    const formats = AD_FORMATS.filter(f => selectedFormats.includes(f.id))
    if (formats.length === 0) return

    console.log('[ExportModal] handleDownload — running design police')

    // Render a REAL canvas with actual images for accurate contrast checks
    const format0 = formats[0]
    let bgImg = null
    let logoImg = null
    let badgeImg = null
    try {
      if (state.image) bgImg = await loadImage(state.image.src)
      if (state.logo) logoImg = await loadImage(state.logo)
      if (state.activeBadgeSrc) badgeImg = await loadImage(state.activeBadgeSrc)
    } catch (err) {
      console.error('[ExportModal] Image load for police check failed:', err)
    }

    const textTheme = state.image ? getTextTheme(state.image.luminance) : 'light'
    const autoColor = textTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
    const overlayGradient = getOverlayGradient(textTheme)

    let checkCanvas = null
    try {
      checkCanvas = renderCanvas({
        format: format0, state, bgImg, logoImg, badgeImg, autoColor, overlayGradient,
        hFont: fontStr(state.headlineFont),
        tFont: fontStr(state.taglineFont),
        sFont: fontStr(state.subtextFont),
        cFont: fontStr(state.ctaFont),
      })
    } catch (err) {
      console.error('[ExportModal] Design check render failed:', err)
    }

    const issues = runDesignChecks(state, checkCanvas, format0)
    const hasIssues = issues.some(i => i.level === 'error' || i.level === 'warning')

    if (hasIssues) {
      // Show design police modal — user must click "Yine de Al" to proceed
      dispatch({ type: 'SET_DESIGN_ISSUES', payload: issues })
      dispatch({ type: 'SET_SHOW_DESIGN_POLICE', payload: true })
      return
    }

    // No issues — export directly
    await doExport(formats)
  }, [selectedFormats, state, dispatch, exportFormat, quality])

  const doExport = async (formats) => {
    console.log('[ExportModal] doExport start, formats:', formats.length, 'format:', exportFormat)
    setIsGenerating(true)
    cancelRef.current = false
    setProgress({ current: 0, total: formats.length })

    try {
      let bgImg = null
      let logoImg = null
      let badgeImg = null

      if (state.image) {
        console.log('[ExportModal] Loading bg image...')
        bgImg = await loadImage(state.image.src)
      }
      if (state.logo) logoImg = await loadImage(state.logo)
      if (state.activeBadgeSrc) badgeImg = await loadImage(state.activeBadgeSrc)

      const textTheme = state.image ? getTextTheme(state.image.luminance) : 'light'
      const autoColor = textTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
      const overlayGradient = getOverlayGradient(textTheme)
      const hFont = fontStr(state.headlineFont)
      const tFont = fontStr(state.taglineFont)
      const sFont = fontStr(state.subtextFont)
      const cFont = fontStr(state.ctaFont)

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const brandPrefix = state.logoType === 'shark' ? 'shark' : state.logoType === 'ninja' ? 'ninja' : 'sharkninja'

      // HTML5 export path
      if (exportFormat === 'html5') {
        const zip = new JSZip()
        let generated = 0
        const sizeWarnings = []

        for (const format of formats) {
          if (cancelRef.current) break

          console.log('[ExportModal] Generating HTML5 for:', format.id)
          const { html, sizeKB } = await generateHTML5Banner({
            format, state, bgImg, logoImg, badgeImg, autoColor, overlayGradient,
          })

          if (sizeKB > 150) {
            sizeWarnings.push(`${format.name} (${sizeKB}KB)`)
          }

          const fmtName = format.name.toLowerCase().replace(/[/\s]+/g, '_')
          const fileName = `${brandPrefix}_${fmtName}_${format.width}x${format.height}.html`
          const folder = getPlatformFolder(format.platform)
          zip.file(`${folder}/${fileName}`, html)
          generated++
          setProgress({ current: generated, total: formats.length })
          await new Promise(r => setTimeout(r, 0))
        }

        if (!cancelRef.current) {
          if (sizeWarnings.length > 0) {
            dispatch({
              type: 'ADD_TOAST',
              payload: {
                message: `Bu banner${sizeWarnings.length > 1 ? 'lar' : ''} 150KB limitini aşıyor — görseli sıkıştırın veya metin azaltın: ${sizeWarnings.join(', ')}`,
                variant: 'error',
              },
            })
          }

          setProgress({ current: formats.length, total: formats.length, zipping: true })

          if (formats.length === 1) {
            const format = formats[0]
            const { html } = await generateHTML5Banner({
              format, state, bgImg, logoImg, badgeImg, autoColor, overlayGradient,
            })
            const blob = new Blob([html], { type: 'text/html' })
            const fmtName = format.name.toLowerCase().replace(/[/\s]+/g, '_')
            saveAs(blob, `${brandPrefix}_${fmtName}_${format.width}x${format.height}.html`)
          } else {
            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `banners_html5_${dateStr}.zip`)
          }
          dispatch({ type: 'ADD_TOAST', payload: { message: `${generated} HTML5 banners downloaded`, variant: 'success' } })
        }
      } else {
        // Image export path (PNG/JPG)
        const ext = exportFormat === 'jpg' ? 'jpg' : 'png'
        const mimeType = exportFormat === 'jpg' ? 'image/jpeg' : 'image/png'
        const getFileName = (format, version = 1) => {
          const fmtName = format.name.toLowerCase().replace(/[/\s]+/g, '_')
          return `${brandPrefix}_${fmtName}_v${version}_${dateStr}.${ext}`
        }

        // Single format → direct download
        if (formats.length === 1) {
          const format = formats[0]
          console.log('[ExportModal] Rendering single format:', format.id)
          const canvas = renderCanvas({
            format, state, bgImg, logoImg, badgeImg, autoColor, overlayGradient, hFont, tFont, sFont, cFont,
          })
          const blob = await new Promise(resolve =>
            canvas.toBlob(resolve, mimeType, quality)
          )
          saveAs(blob, getFileName(format))
          setProgress({ current: 1, total: 1 })
          dispatch({ type: 'ADD_TOAST', payload: { message: `${format.name} downloaded`, variant: 'success' } })
        } else {
          // Multiple → ZIP with per-format folders
          const zip = new JSZip()
          let generated = 0

          for (const format of formats) {
            if (cancelRef.current) break

            console.log('[ExportModal] Rendering format:', format.id)
            const canvas = renderCanvas({
              format, state, bgImg, logoImg, badgeImg, autoColor, overlayGradient, hFont, tFont, sFont, cFont,
            })
            const blob = await new Promise(resolve =>
              canvas.toBlob(resolve, mimeType, quality)
            )
            const folder = getFormatFolder(format)
            zip.file(`${folder}/${getFileName(format)}`, blob)
            generated++
            setProgress({ current: generated, total: formats.length })
            await new Promise(r => setTimeout(r, 0))
          }

          if (!cancelRef.current) {
            setProgress({ current: formats.length, total: formats.length, zipping: true })
            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `banners_${dateStr}.zip`)
            dispatch({ type: 'ADD_TOAST', payload: { message: `${generated} banners downloaded`, variant: 'success' } })
          }
        }
      }
      console.log('[ExportModal] doExport complete')
    } catch (err) {
      console.error('[ExportModal] Export failed:', err)
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Export failed', variant: 'error' } })
    } finally {
      setIsGenerating(false)
      setProgress(null)
    }
  }

  // Listen for "export anyway" from design police
  useEffect(() => {
    const handler = () => {
      const formats = AD_FORMATS.filter(f => selectedFormats.includes(f.id))
      doExport(formats)
    }
    window.addEventListener('banner-export-anyway', handler)
    return () => window.removeEventListener('banner-export-anyway', handler)
  }, [selectedFormats, state])

  // ---- All hooks are above this line ----
  // Early return MUST be after all hooks to satisfy React rules of hooks
  if (!state.showExportModal) return null

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const brandPrefix = state.logoType === 'shark' ? 'shark' : state.logoType === 'ninja' ? 'ninja' : 'sharkninja'
  const ext = exportFormat === 'html5' ? 'html' : exportFormat === 'jpg' ? 'jpg' : 'png'

  const filteredFormats = platformFilter === 'all'
    ? AD_FORMATS
    : AD_FORMATS.filter(f => f.platform === platformFilter)

  const toggleFormat = (id) => {
    setSelectedFormats(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const selectAllVisible = () => {
    const ids = filteredFormats.map(f => f.id)
    setSelectedFormats(prev => [...new Set([...prev, ...ids])])
  }

  const selectNoneVisible = () => {
    const ids = new Set(filteredFormats.map(f => f.id))
    setSelectedFormats(prev => prev.filter(id => !ids.has(id)))
  }

  const close = () => {
    if (isGenerating) return
    dispatch({ type: 'SET_SHOW_EXPORT_MODAL', payload: false })
  }

  const getFileName = (format, version = 1) => {
    const fmtName = format.name.toLowerCase().replace(/[/\s]+/g, '_')
    if (exportFormat === 'html5') {
      return `${brandPrefix}_${fmtName}_${format.width}x${format.height}.html`
    }
    return `${brandPrefix}_${fmtName}_v${version}_${dateStr}.${ext}`
  }

  const selectedCount = selectedFormats.length
  const previewName = selectedCount > 0
    ? getFileName(AD_FORMATS.find(f => selectedFormats.includes(f.id)) || AD_FORMATS[0])
    : ''

  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4" style={{ borderBottom: '1px solid #E0E0DC' }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0A0A0A' }}>
          Export
        </h1>
        <button
          onClick={close}
          disabled={isGenerating}
          className="text-secondary hover:text-ink bg-transparent border-none cursor-pointer disabled:opacity-30"
          style={{ fontSize: '20px', lineHeight: 1 }}
          aria-label="Close export modal"
        >
          &times;
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Filter row */}
        <div className="flex items-center gap-2 mb-4">
          {PLATFORMS.map(p => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className="font-mono uppercase tracking-[0.08em] px-3 py-1 cursor-pointer transition-all"
              style={{
                fontSize: '11px',
                background: platformFilter === p ? '#0A0A0A' : 'transparent',
                color: platformFilter === p ? '#FAFAF8' : '#999994',
                border: '1px solid ' + (platformFilter === p ? '#0A0A0A' : '#E0E0DC'),
              }}
            >
              {p}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={selectAllVisible}
            className="text-[11px] font-mono text-ink hover:underline bg-transparent border-none cursor-pointer"
          >
            Select All
          </button>
          <span className="text-secondary text-[11px]">/</span>
          <button
            onClick={selectNoneVisible}
            className="text-[11px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer"
          >
            None
          </button>
        </div>

        {/* Preview grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {filteredFormats.map(format => {
            const isSelected = selectedFormats.includes(format.id)
            const thumb = thumbnails[format.id]

            return (
              <div
                key={format.id}
                className="relative cursor-pointer group"
                onClick={() => toggleFormat(format.id)}
              >
                <div
                  className="w-full overflow-hidden transition-all"
                  style={{
                    border: isSelected ? '2px solid #0A0A0A' : '2px solid #E0E0DC',
                    opacity: isSelected ? 1 : 0.5,
                  }}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={format.name}
                      className="w-full block"
                      style={{ aspectRatio: `${format.width}/${format.height}`, objectFit: 'cover', maxHeight: '200px' }}
                    />
                  ) : (
                    <div
                      className="w-full bg-ink/10"
                      style={{ aspectRatio: `${format.width}/${format.height}`, maxHeight: '200px' }}
                    />
                  )}
                </div>
                {/* Checkbox */}
                <div
                  className="absolute top-2 left-2 w-5 h-5 flex items-center justify-center"
                  style={{
                    background: isSelected ? '#0A0A0A' : '#FFFFFF',
                    border: '1px solid ' + (isSelected ? '#0A0A0A' : '#E0E0DC'),
                  }}
                >
                  {isSelected && (
                    <span style={{ color: '#FFFFFF', fontSize: '12px', lineHeight: 1 }}>✓</span>
                  )}
                </div>
                <p className="font-mono text-ink mt-1" style={{ fontSize: '11px' }}>{format.name}</p>
                <p className="font-mono text-secondary" style={{ fontSize: '11px' }}>
                  {format.width}&times;{format.height}
                </p>
              </div>
            )
          })}
        </div>

        {/* Export options */}
        <div className="space-y-4 mb-8" style={{ borderTop: '1px solid #E0E0DC', paddingTop: '24px' }}>
          {/* Format toggle */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-secondary uppercase">Format</span>
            <div className="flex gap-1">
              {['png', 'jpg', 'html5'].map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className="text-[11px] font-mono uppercase px-3 py-1 cursor-pointer transition-all"
                  style={{
                    background: exportFormat === fmt ? '#0A0A0A' : 'transparent',
                    color: exportFormat === fmt ? '#FAFAF8' : '#999994',
                    border: '1px solid ' + (exportFormat === fmt ? '#0A0A0A' : '#E0E0DC'),
                  }}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Quality — hidden for HTML5 */}
          {exportFormat !== 'html5' && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-secondary uppercase">Quality</span>
              <div className="flex gap-1">
                {[{ v: 0.6, l: '60%' }, { v: 0.8, l: '80%' }, { v: 1.0, l: '100%' }].map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => setQuality(opt.v)}
                    className="text-[11px] font-mono px-3 py-1 cursor-pointer transition-all"
                    style={{
                      background: quality === opt.v ? '#0A0A0A' : 'transparent',
                      color: quality === opt.v ? '#FAFAF8' : '#999994',
                      border: '1px solid ' + (quality === opt.v ? '#0A0A0A' : '#E0E0DC'),
                    }}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* HTML5 info */}
          {exportFormat === 'html5' && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-secondary uppercase">Info</span>
              <span className="text-[11px] font-mono text-secondary">
                Self-contained .html files / Google Fonts / max 150KB per file
              </span>
            </div>
          )}

          {/* File naming preview */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-secondary uppercase">Naming</span>
            <code className="text-[11px] font-mono text-ink" style={{ background: '#F0F0EC', padding: '4px 8px' }}>
              {previewName}
            </code>
          </div>
        </div>

        {/* Progress */}
        {progress && (
          <div className="mb-6 space-y-2">
            <div className="w-full h-1.5 bg-border">
              <div
                className="h-1.5 bg-ink transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-[11px] font-mono text-secondary">
              {progress.zipping
                ? 'Preparing ZIP file...'
                : `Preparing ${progress.current}/${progress.total} files...`}
            </p>
          </div>
        )}

        {/* Download CTA */}
        <button
          onClick={handleDownload}
          disabled={isGenerating || selectedCount === 0}
          className="py-3 px-8 text-[12px] font-mono uppercase tracking-[0.15em]
            bg-ink text-bg
            hover:bg-bg hover:text-ink
            disabled:opacity-20 disabled:cursor-not-allowed
            transition-all duration-200 cursor-pointer"
          style={{ border: '1px solid #0A0A0A' }}
        >
          {isGenerating
            ? 'Generating...'
            : exportFormat === 'html5'
              ? selectedCount === 1
                ? 'Download HTML5'
                : `Download HTML5 ZIP (${selectedCount} formats)`
              : selectedCount === 1
                ? `Download ${ext.toUpperCase()}`
                : `Download ZIP (${selectedCount} formats)`}
        </button>

        {/* Video section — collapsed, coming soon */}
        <div className="mt-8" style={{ borderTop: '1px solid #E0E0DC', paddingTop: '16px' }}>
          <button
            onClick={() => setShowVideo(!showVideo)}
            className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
          >
            <span
              className="text-secondary transition-transform duration-200 inline-block"
              style={{ fontSize: '8px', transform: showVideo ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            >
              ▼
            </span>
            <span className="font-mono text-ink uppercase" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>
              Video
            </span>
            <span className="text-[11px] font-mono text-secondary ml-2">Coming Soon</span>
          </button>

          {showVideo && (
            <div className="mt-3 space-y-3 opacity-40 pointer-events-none">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-secondary uppercase">Animation</span>
                <div className="flex gap-1">
                  {ANIM_TYPES.map(a => (
                    <button
                      key={a}
                      className="text-[11px] font-mono px-2 py-1 cursor-not-allowed"
                      style={{ border: '1px solid #E0E0DC', color: '#999994' }}
                      disabled
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-secondary uppercase">Duration</span>
                <div className="flex gap-1">
                  {DURATIONS.map(d => (
                    <button
                      key={d}
                      className="text-[11px] font-mono px-2 py-1 cursor-not-allowed"
                      style={{ border: '1px solid #E0E0DC', color: '#999994' }}
                      disabled
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <button
                disabled
                className="py-2 px-6 text-[11px] font-mono uppercase tracking-[0.1em] cursor-not-allowed"
                style={{ border: '1px solid #E0E0DC', color: '#999994', background: 'transparent' }}
              >
                Generate Video
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function fontStr(name) {
  return `"${name}", sans-serif`
}

function getCornerPos(position, canvasW, canvasH, elemW, elemH, padding) {
  switch (position) {
    case 'top-left':     return { x: padding, y: padding }
    case 'top-right':    return { x: canvasW - padding - elemW, y: padding }
    case 'bottom-left':  return { x: padding, y: canvasH - padding - elemH }
    case 'bottom-right': return { x: canvasW - padding - elemW, y: canvasH - padding - elemH }
    default:             return { x: padding, y: padding }
  }
}

function renderCanvas({ format, state, bgImg, logoImg, badgeImg, autoColor, overlayGradient, hFont, tFont, sFont, cFont }) {
  const canvas = document.createElement('canvas')
  canvas.width = format.width
  canvas.height = format.height
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#1E1E1E'
  ctx.fillRect(0, 0, format.width, format.height)

  if (bgImg) {
    const formatKey = `${format.width}x${format.height}`
    const focusPoint = state.focusPoints?.[formatKey] || { x: 0.5, y: 0.5 }
    const crop = getCenterCrop(bgImg.width, bgImg.height, format.width, format.height, focusPoint)
    ctx.drawImage(bgImg, crop.sx, crop.sy, crop.sWidth, crop.sHeight, 0, 0, format.width, format.height)
    const gradient = ctx.createLinearGradient(0, format.height * 0.3, 0, format.height)
    gradient.addColorStop(0, overlayGradient.to)
    gradient.addColorStop(1, overlayGradient.from)
    ctx.fillStyle = gradient
    ctx.fillRect(0, format.height * 0.3, format.width, format.height * 0.7)
  }

  const sc = Math.min(format.width, format.height) / 1080
  const fontSc = format.width / 1080
  const padding = Math.round(40 * sc)
  const headlineSize = Math.max(10, Math.round((state.headlineSize || 48) * fontSc))
  const taglineSize = Math.max(10, Math.round((state.taglineSize || 28) * fontSc))
  const subtextSize = Math.max(10, Math.round((state.subtextSize || 20) * fontSc))
  const ctaFontSize = Math.max(10, Math.round((state.ctaSize || 18) * fontSc))
  const badgeFontSize = Math.max(10, Math.round(14 * fontSc))
  const logoHeight = Math.round((state.logoSize || 40) * sc)
  const badgeImgSize = Math.round((state.badgeSize || 60) * sc)
  const textAreaY = format.height * 0.50

  const getPos = (field, defaultX, defaultY) => {
    if (state.textPositions?.[field]) {
      return {
        x: state.textPositions[field].x * format.width,
        y: state.textPositions[field].y * format.height,
      }
    }
    return { x: defaultX, y: defaultY }
  }

  if (logoImg) {
    const lw = logoHeight * (logoImg.width / logoImg.height)
    const lp = getCornerPos(state.logoPosition, format.width, format.height, lw, logoHeight, padding)
    ctx.drawImage(logoImg, lp.x, lp.y, lw, logoHeight)
  }

  const bpos = state.badgePosition || 'top-right'
  const showBadge = state.badgeEnabled || state.badgeLine1 || state.badgeLine2 || state.badgeLine3

  if (showBadge) {
    const scaledSize = Math.round((state.badgeSize || 60) * sc)
    const bp = getCornerPos(bpos, format.width, format.height, scaledSize, scaledSize, padding)
    const cx = bp.x + scaledSize / 2
    const cy = bp.y + scaledSize / 2
    const half = scaledSize / 2
    const rot = (state.badgeRotation || 0) * Math.PI / 180

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)

    ctx.fillStyle = state.badgeBgColor || '#FF3D57'
    const shape = state.badgeShape || 'circle'
    if (shape === 'circle') {
      ctx.beginPath()
      ctx.arc(0, 0, half, 0, Math.PI * 2)
      ctx.fill()
      if (state.badgeBorderWidth > 0) { ctx.strokeStyle = state.badgeBorderColor || '#FFF'; ctx.lineWidth = state.badgeBorderWidth * sc; ctx.stroke() }
    } else if (shape === 'rectangle') {
      ctx.fillRect(-half, -half, scaledSize, scaledSize)
      if (state.badgeBorderWidth > 0) { ctx.strokeStyle = state.badgeBorderColor || '#FFF'; ctx.lineWidth = state.badgeBorderWidth * sc; ctx.strokeRect(-half, -half, scaledSize, scaledSize) }
    } else if (shape === 'pill') {
      const ph = scaledSize * 0.6
      const r = ph / 2
      ctx.beginPath()
      ctx.moveTo(-half + r, -ph / 2)
      ctx.lineTo(half - r, -ph / 2)
      ctx.arc(half - r, 0, r, -Math.PI / 2, Math.PI / 2)
      ctx.lineTo(-half + r, ph / 2)
      ctx.arc(-half + r, 0, r, Math.PI / 2, -Math.PI / 2)
      ctx.closePath()
      ctx.fill()
      if (state.badgeBorderWidth > 0) { ctx.strokeStyle = state.badgeBorderColor || '#FFF'; ctx.lineWidth = state.badgeBorderWidth * sc; ctx.stroke() }
    } else if (shape === 'starburst') {
      const points = 12
      const inner = half * 0.7
      ctx.beginPath()
      for (let i = 0; i < points * 2; i++) {
        const r2 = i % 2 === 0 ? half : inner
        const a = (Math.PI * i) / points - Math.PI / 2
        ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r2, Math.sin(a) * r2)
      }
      ctx.closePath()
      ctx.fill()
      if (state.badgeBorderWidth > 0) { ctx.strokeStyle = state.badgeBorderColor || '#FFF'; ctx.lineWidth = state.badgeBorderWidth * sc; ctx.stroke() }
    }

    const lines = [state.badgeLine1, state.badgeLine2, state.badgeLine3].filter(Boolean)
    if (lines.length > 0) {
      const bfSize = Math.max(10, Math.round((state.badgeFontSize || 12) * fontSc))
      const bfStyle = `${state.badgeBold ? 'bold' : ''} ${state.badgeItalic ? 'italic' : ''}`.trim()
      ctx.font = `${bfStyle || 'normal'} ${bfSize}px "${state.badgeFontFamily || 'Barlow Condensed'}", sans-serif`
      ctx.fillStyle = state.badgeTextColor || '#FFFFFF'
      ctx.textAlign = state.badgeTextAlign || 'center'
      ctx.textBaseline = 'middle'
      const lineH = bfSize * 1.2
      const totalH = lines.length * lineH
      const startY = -totalH / 2 + lineH / 2
      lines.forEach((line, i) => {
        const tx = state.badgeTextAlign === 'left' ? -half + 4 : state.badgeTextAlign === 'right' ? half - 4 : 0
        ctx.fillText(line, tx, startY + i * lineH)
      })
    }

    ctx.restore()
  } else if (badgeImg) {
    const bh = badgeImgSize * (badgeImg.height / badgeImg.width)
    const bp = getCornerPos(bpos, format.width, format.height, badgeImgSize, bh, padding)
    ctx.drawImage(badgeImg, bp.x, bp.y, badgeImgSize, bh)
  } else if (state.badge) {
    const bw = Math.max(state.badge.length * badgeFontSize * 0.65, 60)
    const bh = badgeFontSize * 2.2
    const bp = getCornerPos(bpos, format.width, format.height, bw, bh, padding)
    ctx.fillStyle = state.brandColor
    ctx.fillRect(bp.x, bp.y, bw, bh)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${badgeFontSize}px ${hFont}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(state.badge, bp.x + bw / 2, bp.y + bh / 2)
  }

  let yOff = textAreaY

  if (state.headline) {
    const pos = getPos('headline', padding, yOff)
    ctx.fillStyle = state.headlineColor || autoColor
    ctx.font = `bold ${headlineSize}px ${hFont}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.globalAlpha = 1
    yOff = wrapText(ctx, state.headline.toUpperCase(), pos.x, pos.y, format.width - padding * 2, headlineSize * 1.1)
    yOff += 6
  }

  if (state.tagline) {
    const pos = getPos('tagline', padding, yOff)
    ctx.fillStyle = state.taglineColor || autoColor
    ctx.globalAlpha = state.taglineColor ? 1 : 0.9
    ctx.font = `italic ${taglineSize}px ${tFont}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    yOff = wrapText(ctx, state.tagline, pos.x, pos.y, format.width - padding * 2, taglineSize * 1.3)
    yOff += 4
    ctx.globalAlpha = 1
  }

  if (state.subtext) {
    const pos = getPos('subtext', padding, yOff)
    ctx.fillStyle = state.subtextColor || autoColor
    ctx.globalAlpha = state.subtextColor ? 1 : 0.8
    ctx.font = `${subtextSize}px ${sFont}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    wrapText(ctx, state.subtext, pos.x, pos.y, format.width - padding * 2, subtextSize * 1.6)
    ctx.globalAlpha = 1
  }

  // Extra text layers
  const extras = state.extraTextLayers || []
  for (const layer of extras) {
    if (!layer.content) continue
    const layerSize = Math.max(10, Math.round((layer.size || 24) * fontSc))
    const pos = getPos(layer.id, padding, textAreaY + 60 * sc)
    const isHL = layer.type === 'headline'
    const isTL = layer.type === 'tagline'
    const layerFont = fontStr(layer.font)
    ctx.fillStyle = layer.color || autoColor
    ctx.globalAlpha = layer.color ? 1 : (isTL ? 0.9 : isHL ? 1 : 0.8)
    ctx.font = `${isHL ? 'bold' : isTL ? 'italic' : ''} ${layerSize}px ${layerFont}`.trim()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    wrapText(ctx, isHL ? layer.content.toUpperCase() : layer.content, pos.x, pos.y, format.width - padding * 2, layerSize * 1.3)
    ctx.globalAlpha = 1
  }

  if (state.ctaText) {
    const pos = getPos('cta', padding, format.height - padding - ctaFontSize * 2.5)
    const ctaW = Math.max(state.ctaText.length * ctaFontSize * 0.65, 100)
    const ctaH = ctaFontSize * 2.5
    ctx.fillStyle = state.ctaColor || '#0A0A0A'
    ctx.fillRect(pos.x, pos.y, ctaW, ctaH)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `500 ${ctaFontSize}px ${cFont}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(state.ctaText.toUpperCase(), pos.x + ctaW / 2, pos.y + ctaH / 2)
  }

  ctx.fillStyle = state.brandColor
  ctx.fillRect(0, format.height - 3, format.width, 3)

  return canvas
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  // Handle explicit line breaks
  const paragraphs = text.split('\n')
  let offsetY = y
  for (const para of paragraphs) {
    const words = para.split(' ')
    let line = ''
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' '
      if (ctx.measureText(testLine).width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, offsetY)
        line = words[i] + ' '
        offsetY += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line.trim(), x, offsetY)
    offsetY += lineHeight
  }
  return offsetY
}
