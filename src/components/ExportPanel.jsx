import { useState, useCallback, useRef, useEffect } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { AD_FORMATS, getPlatformFolder } from '../utils/formats'
import { getCenterCrop } from '../utils/cropImage'
import { getTextTheme, getOverlayGradient } from '../utils/luminance'
import { runDesignChecks } from '../utils/designPolice'
import FormatChecklist from './FormatChecklist'

const QUALITY_OPTIONS = [
  { value: 0.6, label: '60%' },
  { value: 0.8, label: '80%' },
  { value: 1.0, label: '100%' },
]

export default function ExportPanel() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const [enabledFormats, setEnabledFormats] = useState(AD_FORMATS.map(f => f.id))
  const exportFnRef = useRef(null)

  const toggleFormat = (id) => {
    setEnabledFormats(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const selectAll = () => setEnabledFormats(AD_FORMATS.map(f => f.id))
  const selectNone = () => setEnabledFormats([])

  const doExport = useCallback(async () => {
    if (enabledFormats.length === 0) {
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Select at least one format', variant: 'error' } })
      return
    }

    dispatch({ type: 'SET_EXPORTING', payload: true })
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Generating...', variant: 'info' } })

    try {
      const formats = AD_FORMATS.filter(f => enabledFormats.includes(f.id))

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

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const mimeType = state.exportQuality < 1 ? 'image/jpeg' : 'image/png'
      const ext = state.exportQuality < 1 ? 'jpg' : 'png'

      // Single format → direct download
      if (formats.length === 1) {
        const format = formats[0]
        const canvas = renderCanvas({
          format, state, bgImg, logoImg, badgeImg, autoColor, overlayGradient, hFont, tFont, sFont, cFont,
        })
        const blob = await new Promise(resolve =>
          canvas.toBlob(resolve, mimeType, state.exportQuality)
        )
        const fileName = `SharkNinja_${format.name.replace(/[/\s]+/g, '_')}_${dateStr}.${ext}`
        saveAs(blob, fileName)
        dispatch({ type: 'ADD_TOAST', payload: { message: `${format.name} exported`, variant: 'success' } })
      } else {
        // Multiple → ZIP
        const zip = new JSZip()
        for (const format of formats) {
          const canvas = renderCanvas({
            format, state, bgImg, logoImg, badgeImg, autoColor, overlayGradient, hFont, tFont, sFont, cFont,
          })
          const blob = await new Promise(resolve =>
            canvas.toBlob(resolve, mimeType, state.exportQuality)
          )
          const folder = getPlatformFolder(format.platform)
          const fileName = `SharkNinja_${format.name.replace(/[/\s]+/g, '_')}_v1_${dateStr}.${ext}`
          zip.file(`${folder}/${fileName}`, blob)
        }

        const content = await zip.generateAsync({ type: 'blob' })
        saveAs(content, `banners_${dateStr}.zip`)
        dispatch({ type: 'ADD_TOAST', payload: { message: `${formats.length} banners exported`, variant: 'success' } })
      }
    } catch (err) {
      console.error('Export failed:', err)
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Export failed', variant: 'error' } })
    } finally {
      dispatch({ type: 'SET_EXPORTING', payload: false })
    }
  }, [enabledFormats, state, dispatch])

  // Store export fn for design police "Export Anyway" (only used when export modal is NOT open)
  exportFnRef.current = doExport

  // Listen for "export anyway" event from DesignPoliceModal
  // Only handle if export modal is NOT open (ExportModal handles its own)
  useEffect(() => {
    const handler = () => {
      if (!state.showExportModal) exportFnRef.current?.()
    }
    window.addEventListener('banner-export-anyway', handler)
    return () => window.removeEventListener('banner-export-anyway', handler)
  }, [state.showExportModal])

  const handleExport = useCallback(() => {
    if (enabledFormats.length === 0) {
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Select at least one format', variant: 'error' } })
      return
    }
    // Open export modal
    dispatch({ type: 'SET_SHOW_EXPORT_MODAL', payload: true })
  }, [enabledFormats, dispatch])

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink mb-3">
          Formats
        </h3>
        <FormatChecklist enabledFormats={enabledFormats} onToggle={toggleFormat} />
      </div>

      <div className="flex gap-2 text-[11px] font-mono">
        <button
          onClick={selectAll}
          className="text-ink hover:underline bg-transparent border-none cursor-pointer p-0"
          aria-label="Select all formats"
        >
          All
        </button>
        <span className="text-secondary">/</span>
        <button
          onClick={selectNone}
          className="text-secondary hover:underline bg-transparent border-none cursor-pointer p-0"
          aria-label="Deselect all formats"
        >
          None
        </button>
      </div>

      {/* Quality selector */}
      <div className="space-y-1">
        <p className="text-[11px] font-mono text-secondary">Quality</p>
        <div className="flex gap-1">
          {QUALITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => dispatch({ type: 'SET_EXPORT_QUALITY', payload: opt.value })}
              className="text-[11px] font-mono px-2 py-1 cursor-pointer transition-all"
              style={{
                background: state.exportQuality === opt.value ? '#0A0A0A' : 'transparent',
                color: state.exportQuality === opt.value ? '#FAFAF8' : '#999994',
                border: '1px solid ' + (state.exportQuality === opt.value ? '#0A0A0A' : '#E0E0DC'),
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={state.isExporting || enabledFormats.length === 0}
        className="w-full py-2.5 px-3 text-[11px] font-mono uppercase tracking-[0.15em]
          bg-ink text-bg
          hover:bg-bg hover:text-ink
          disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-ink disabled:hover:text-bg
          transition-all duration-200 cursor-pointer"
        style={{ border: '1px solid #0A0A0A' }}
        aria-label={state.isExporting ? 'Exporting...' : `Export ${enabledFormats.length} formats`}
      >
        {state.isExporting
          ? 'Exporting...'
          : enabledFormats.length === 1
            ? 'Download PNG'
            : `Generate ${enabledFormats.length} Formats`}
      </button>
    </div>
  )
}

// Shared export function reference for design police
export function getExportFn() {
  return null
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

  const getPos = (field, defaultX, defaultY) => {
    if (state.textPositions?.[field]) return state.textPositions[field]
    return { x: defaultX, y: defaultY }
  }

  // Logo — positioned
  if (logoImg) {
    const lw = logoHeight * (logoImg.width / logoImg.height)
    const lp = getCornerPos(state.logoPosition, format.width, format.height, lw, logoHeight, padding)
    ctx.drawImage(logoImg, lp.x, lp.y, lw, logoHeight)
  }

  // Badge — positioned
  const bpos = state.badgePosition || 'top-right'
  const showBadge = state.badgeEnabled || state.badgeLine1 || state.badgeLine2 || state.badgeLine3

  if (showBadge) {
    // Badge designer: render shape + multi-line text
    const scaledSize = Math.round((state.badgeSize || 60) * sc)
    const bp = getCornerPos(bpos, format.width, format.height, scaledSize, scaledSize, padding)
    const cx = bp.x + scaledSize / 2
    const cy = bp.y + scaledSize / 2
    const half = scaledSize / 2
    const rot = (state.badgeRotation || 0) * Math.PI / 180

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)

    // Shape
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
        const method = i === 0 ? 'moveTo' : 'lineTo'
        ctx[method](Math.cos(a) * r2, Math.sin(a) * r2)
      }
      ctx.closePath()
      ctx.fill()
      if (state.badgeBorderWidth > 0) { ctx.strokeStyle = state.badgeBorderColor || '#FFF'; ctx.lineWidth = state.badgeBorderWidth * sc; ctx.stroke() }
    }

    // Text
    const lines = [state.badgeLine1, state.badgeLine2, state.badgeLine3].filter(Boolean)
    if (lines.length > 0) {
      const bfSize = Math.round((state.badgeFontSize || 12) * sc)
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
    const layerSize = Math.round((layer.size || 24) * sc)
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
