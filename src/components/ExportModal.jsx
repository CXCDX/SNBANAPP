import { useState, useCallback, useRef, useEffect } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { AD_FORMATS, getFormatFolder } from '../utils/formats'
import { getCenterCrop } from '../utils/cropImage'
import { getTextTheme, getOverlayGradient } from '../utils/luminance'
import { runDesignChecks } from '../utils/designPolice'

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

  if (!state.showExportModal) return null

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const brandPrefix = state.logoType === 'shark' ? 'shark' : state.logoType === 'ninja' ? 'ninja' : 'sharkninja'
  const ext = exportFormat === 'jpg' ? 'jpg' : 'png'
  const mimeType = exportFormat === 'jpg' ? 'image/jpeg' : 'image/png'

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
    return `${brandPrefix}_${fmtName}_v${version}_${dateStr}.${ext}`
  }

  // Generate thumbnails on mount
  useEffect(() => {
    if (!state.showExportModal) return
    generateThumbnails()
  }, [state.showExportModal])

  const generateThumbnails = async () => {
    const thumbs = {}
    let bgImg = null
    let logoImg = null
    let badgeImg = null

    if (state.image) bgImg = await loadImage(state.image.src)
    if (state.logo) logoImg = await loadImage(state.logo)
    if (state.activeBadgeSrc) badgeImg = await loadImage(state.activeBadgeSrc)

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
      } catch {
        thumbs[format.id] = null
      }
    }
    setThumbnails(thumbs)
  }

  const handleDownload = useCallback(async () => {
    const formats = AD_FORMATS.filter(f => selectedFormats.includes(f.id))
    if (formats.length === 0) return

    // Run design police first
    const format0 = formats[0]
    let checkCanvas = null
    try {
      checkCanvas = renderCanvas({
        format: format0, state,
        bgImg: null, logoImg: null, badgeImg: null,
        autoColor: '#F5F5F5',
        overlayGradient: getOverlayGradient('light'),
        hFont: fontStr(state.headlineFont),
        tFont: fontStr(state.taglineFont),
        sFont: fontStr(state.subtextFont),
        cFont: fontStr(state.ctaFont),
      })
    } catch {}

    const issues = runDesignChecks(state, checkCanvas, format0)
    const hasIssues = issues.some(i => i.level === 'error' || i.level === 'warning')

    if (hasIssues) {
      dispatch({ type: 'SET_DESIGN_ISSUES', payload: issues })
      dispatch({ type: 'SET_SHOW_DESIGN_POLICE', payload: true })
      return
    }

    // Proceed with export
    await doExport(formats)
  }, [selectedFormats, state, dispatch, exportFormat, quality])

  const doExport = async (formats) => {
    setIsGenerating(true)
    cancelRef.current = false
    setProgress({ current: 0, total: formats.length })

    try {
      let bgImg = null
      let logoImg = null
      let badgeImg = null

      if (state.image) bgImg = await loadImage(state.image.src)
      if (state.logo) logoImg = await loadImage(state.logo)
      if (state.activeBadgeSrc) badgeImg = await loadImage(state.activeBadgeSrc)

      const textTheme = state.image ? getTextTheme(state.image.luminance) : 'light'
      const autoColor = textTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
      const overlayGradient = getOverlayGradient(textTheme)
      const hFont = fontStr(state.headlineFont)
      const tFont = fontStr(state.taglineFont)
      const sFont = fontStr(state.subtextFont)
      const cFont = fontStr(state.ctaFont)

      // Single format → direct download
      if (formats.length === 1) {
        const format = formats[0]
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
    } catch (err) {
      console.error('Export failed:', err)
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
            const aspect = format.height / format.width

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
              {['png', 'jpg'].map(fmt => (
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

          {/* Quality */}
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
  const padding = Math.round(40 * sc)
  const headlineSize = Math.round((state.headlineSize || 48) * sc)
  const taglineSize = Math.round((state.taglineSize || 28) * sc)
  const subtextSize = Math.round((state.subtextSize || 20) * sc)
  const ctaFontSize = Math.round((state.ctaSize || 18) * sc)
  const badgeFontSize = Math.round(14 * sc)
  const logoHeight = Math.round((state.logoSize || 40) * sc)
  const badgeImgSize = Math.round((state.badgeSize || 60) * sc)
  const textAreaY = format.height * 0.50

  if (logoImg) {
    const lw = logoHeight * (logoImg.width / logoImg.height)
    const lp = getCornerPos(state.logoPosition, format.width, format.height, lw, logoHeight, padding)
    ctx.drawImage(logoImg, lp.x, lp.y, lw, logoHeight)
  }

  const bpos = state.badgePosition || 'top-right'
  if (badgeImg) {
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
    ctx.fillStyle = state.headlineColor || autoColor
    ctx.font = `bold ${headlineSize}px ${hFont}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.globalAlpha = 1
    yOff = wrapText(ctx, state.headline.toUpperCase(), padding, yOff, format.width - padding * 2, headlineSize * 1.1)
    yOff += 6
  }

  if (state.tagline) {
    ctx.fillStyle = state.taglineColor || autoColor
    ctx.globalAlpha = state.taglineColor ? 1 : 0.9
    ctx.font = `italic ${taglineSize}px ${tFont}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    yOff = wrapText(ctx, state.tagline, padding, yOff, format.width - padding * 2, taglineSize * 1.3)
    yOff += 4
    ctx.globalAlpha = 1
  }

  if (state.subtext) {
    ctx.fillStyle = state.subtextColor || autoColor
    ctx.globalAlpha = state.subtextColor ? 1 : 0.8
    ctx.font = `${subtextSize}px ${sFont}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    wrapText(ctx, state.subtext, padding, yOff, format.width - padding * 2, subtextSize * 1.6)
    ctx.globalAlpha = 1
  }

  if (state.ctaText) {
    const ctaW = Math.max(state.ctaText.length * ctaFontSize * 0.65, 100)
    const ctaH = ctaFontSize * 2.5
    const ctaY = format.height - padding - ctaH
    ctx.fillStyle = state.ctaColor || '#0A0A0A'
    ctx.fillRect(padding, ctaY, ctaW, ctaH)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `500 ${ctaFontSize}px ${cFont}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(state.ctaText.toUpperCase(), padding + ctaW / 2, ctaY + ctaH / 2)
  }

  ctx.fillStyle = state.brandColor
  ctx.fillRect(0, format.height - 3, format.width, 3)

  return canvas
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let offsetY = y
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
  return offsetY + lineHeight
}
