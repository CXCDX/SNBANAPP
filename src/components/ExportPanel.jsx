import { useState, useRef, useCallback } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group } from 'react-konva'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { AD_FORMATS, getPlatformFolder } from '../utils/formats'
import { getCenterCrop } from '../utils/cropImage'
import { getTextTheme, getOverlayGradient } from '../utils/luminance'
import FormatChecklist from './FormatChecklist'

export default function ExportPanel() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const [enabledFormats, setEnabledFormats] = useState(AD_FORMATS.map(f => f.id))

  const toggleFormat = (id) => {
    setEnabledFormats(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const selectAll = () => setEnabledFormats(AD_FORMATS.map(f => f.id))
  const selectNone = () => setEnabledFormats([])

  const handleExport = useCallback(async () => {
    if (enabledFormats.length === 0) {
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Select at least one format to export', variant: 'error' } })
      return
    }

    dispatch({ type: 'SET_EXPORTING', payload: true })
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Generating banners...', variant: 'info' } })

    try {
      const zip = new JSZip()
      const formats = AD_FORMATS.filter(f => enabledFormats.includes(f.id))

      // Load images once
      let bgImg = null
      let logoImg = null

      if (state.image) {
        bgImg = await loadImage(state.image.src)
      }
      if (state.logo) {
        logoImg = await loadImage(state.logo)
      }

      const textTheme = state.image ? getTextTheme(state.image.luminance) : 'light'
      const textColor = textTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
      const overlayGradient = getOverlayGradient(textTheme)

      for (const format of formats) {
        const canvas = document.createElement('canvas')
        canvas.width = format.width
        canvas.height = format.height
        const ctx = canvas.getContext('2d')

        // Background
        ctx.fillStyle = '#1E1E1E'
        ctx.fillRect(0, 0, format.width, format.height)

        // Background image with smart crop
        if (bgImg) {
          const crop = getCenterCrop(bgImg.width, bgImg.height, format.width, format.height)
          ctx.drawImage(bgImg, crop.sx, crop.sy, crop.sWidth, crop.sHeight, 0, 0, format.width, format.height)

          // Gradient overlay
          const gradient = ctx.createLinearGradient(0, format.height * 0.3, 0, format.height)
          gradient.addColorStop(0, overlayGradient.to)
          gradient.addColorStop(1, overlayGradient.from)
          ctx.fillStyle = gradient
          ctx.fillRect(0, format.height * 0.3, format.width, format.height * 0.7)
        }

        const baseFontScale = Math.min(format.width, format.height) / 1080
        const padding = Math.round(40 * baseFontScale)
        const headlineSize = Math.round(48 * baseFontScale)
        const subtextSize = Math.round(20 * baseFontScale)
        const ctaFontSize = Math.round(18 * baseFontScale)
        const badgeSize = Math.round(14 * baseFontScale)
        const logoHeight = Math.round(40 * baseFontScale)
        const textAreaY = format.height * 0.55

        // Logo
        if (logoImg) {
          const lw = logoHeight * (logoImg.width / logoImg.height)
          ctx.drawImage(logoImg, padding, padding, lw, logoHeight)
        }

        // Badge
        if (state.badge) {
          const bw = Math.max(state.badge.length * badgeSize * 0.65, 60)
          const bh = badgeSize * 2.2
          const bx = format.width - padding - bw
          ctx.fillStyle = state.brandColor
          roundRect(ctx, bx, padding, bw, bh, 4)
          ctx.fill()
          ctx.fillStyle = '#FFFFFF'
          ctx.font = `bold ${badgeSize}px "Barlow Condensed", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(state.badge, bx + bw / 2, padding + bh / 2)
        }

        // Headline
        if (state.headline) {
          ctx.fillStyle = textColor
          ctx.font = `bold ${headlineSize}px "Barlow Condensed", sans-serif`
          ctx.textAlign = 'left'
          ctx.textBaseline = 'top'
          wrapText(ctx, state.headline.toUpperCase(), padding, textAreaY, format.width - padding * 2, headlineSize * 1.1)
        }

        // Subtext
        if (state.subtext) {
          ctx.fillStyle = textColor
          ctx.globalAlpha = 0.85
          ctx.font = `${subtextSize}px "DM Sans", sans-serif`
          ctx.textAlign = 'left'
          ctx.textBaseline = 'top'
          wrapText(ctx, state.subtext, padding, textAreaY + headlineSize * 1.3 + 8, format.width - padding * 2, subtextSize * 1.4)
          ctx.globalAlpha = 1
        }

        // CTA button
        if (state.ctaText) {
          const ctaW = Math.max(state.ctaText.length * ctaFontSize * 0.65, 100)
          const ctaH = ctaFontSize * 2.5
          const ctaY = format.height - padding - ctaH
          ctx.fillStyle = '#FF6B35'
          roundRect(ctx, padding, ctaY, ctaW, ctaH, 6)
          ctx.fill()
          ctx.fillStyle = '#FFFFFF'
          ctx.font = `bold ${ctaFontSize}px "DM Sans", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(state.ctaText.toUpperCase(), padding + ctaW / 2, ctaY + ctaH / 2)
        }

        // Bottom accent strip
        ctx.fillStyle = state.brandColor
        ctx.fillRect(0, format.height - 4, format.width, 4)

        // Export to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
        const folder = getPlatformFolder(format.platform)
        zip.file(`${folder}/${format.name.replace(/[/\s]+/g, '_')}_${format.width}x${format.height}.png`, blob)
      }

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `banners_${Date.now()}.zip`)
      dispatch({ type: 'ADD_TOAST', payload: { message: `Exported ${formats.length} banners!`, variant: 'success' } })
    } catch (err) {
      console.error('Export failed:', err)
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Export failed. Check console.', variant: 'error' } })
    } finally {
      dispatch({ type: 'SET_EXPORTING', payload: false })
    }
  }, [enabledFormats, state, dispatch])

  return (
    <div className="space-y-4">
      <FormatChecklist enabledFormats={enabledFormats} onToggle={toggleFormat} />

      <div className="flex gap-2">
        <button
          onClick={selectAll}
          className="text-xs text-accent hover:underline"
          aria-label="Select all formats"
        >
          All
        </button>
        <span className="text-xs text-text-secondary">/</span>
        <button
          onClick={selectNone}
          className="text-xs text-text-secondary hover:underline"
          aria-label="Deselect all formats"
        >
          None
        </button>
      </div>

      <button
        onClick={handleExport}
        disabled={state.isExporting || enabledFormats.length === 0}
        className="w-full py-2.5 px-4 rounded-lg font-heading font-semibold text-sm uppercase tracking-wider
          bg-cta text-white
          hover:brightness-110 hover:-translate-y-0.5
          active:translate-y-0
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
          transition-all duration-200
          shadow-[0_4px_12px_rgba(255,107,53,0.3)]"
        aria-label={state.isExporting ? 'Exporting banners...' : `Export ${enabledFormats.length} banner formats as ZIP`}
      >
        {state.isExporting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Exporting...
          </span>
        ) : (
          `Export ${enabledFormats.length} Formats as ZIP`
        )}
      </button>
    </div>
  )
}

// Helper: load image from src
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Helper: rounded rect
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// Helper: wrap text
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let offsetY = y

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, offsetY)
      line = words[i] + ' '
      offsetY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line.trim(), x, offsetY)
}
