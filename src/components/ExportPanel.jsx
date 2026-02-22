import { useState, useCallback } from 'react'
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
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Select at least one format', variant: 'error' } })
      return
    }

    dispatch({ type: 'SET_EXPORTING', payload: true })
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Generating...', variant: 'info' } })

    try {
      const zip = new JSZip()
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

      for (const format of formats) {
        const canvas = document.createElement('canvas')
        canvas.width = format.width
        canvas.height = format.height
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = '#1E1E1E'
        ctx.fillRect(0, 0, format.width, format.height)

        if (bgImg) {
          const crop = getCenterCrop(bgImg.width, bgImg.height, format.width, format.height, state.focusPoint)
          ctx.drawImage(bgImg, crop.sx, crop.sy, crop.sWidth, crop.sHeight, 0, 0, format.width, format.height)

          const gradient = ctx.createLinearGradient(0, format.height * 0.3, 0, format.height)
          gradient.addColorStop(0, overlayGradient.to)
          gradient.addColorStop(1, overlayGradient.from)
          ctx.fillStyle = gradient
          ctx.fillRect(0, format.height * 0.3, format.width, format.height * 0.7)
        }

        const sc = Math.min(format.width, format.height) / 1080
        const padding = Math.round(40 * sc)
        const headlineSize = Math.round(48 * sc)
        const taglineSize = Math.round(28 * sc)
        const subtextSize = Math.round(20 * sc)
        const ctaFontSize = Math.round(18 * sc)
        const badgeFontSize = Math.round(14 * sc)
        const logoHeight = Math.round(40 * sc)
        const badgeImgSize = Math.round(60 * sc)
        const textAreaY = format.height * 0.50

        if (logoImg) {
          const lw = logoHeight * (logoImg.width / logoImg.height)
          ctx.drawImage(logoImg, padding, padding, lw, logoHeight)
        }

        // Badge image or text
        if (badgeImg) {
          const bh = badgeImgSize * (badgeImg.height / badgeImg.width)
          ctx.drawImage(badgeImg, format.width - padding - badgeImgSize, padding, badgeImgSize, bh)
        } else if (state.badge) {
          const bw = Math.max(state.badge.length * badgeFontSize * 0.65, 60)
          const bh = badgeFontSize * 2.2
          const bx = format.width - padding - bw
          ctx.fillStyle = state.brandColor
          ctx.fillRect(bx, padding, bw, bh)
          ctx.fillStyle = '#FFFFFF'
          ctx.font = `bold ${badgeFontSize}px ${hFont}`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(state.badge, bx + bw / 2, padding + bh / 2)
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

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
        const folder = getPlatformFolder(format.platform)
        zip.file(`${folder}/${format.name.replace(/[/\s]+/g, '_')}_${format.width}x${format.height}.png`, blob)
      }

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `banners_${Date.now()}.zip`)
      dispatch({ type: 'ADD_TOAST', payload: { message: `${formats.length} banners exported`, variant: 'success' } })
    } catch (err) {
      console.error('Export failed:', err)
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Export failed', variant: 'error' } })
    } finally {
      dispatch({ type: 'SET_EXPORTING', payload: false })
    }
  }, [enabledFormats, state, dispatch])

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-editorial text-[11px] uppercase tracking-[0.08em] text-ink mb-3">
          Formats
        </h3>
        <FormatChecklist enabledFormats={enabledFormats} onToggle={toggleFormat} />
      </div>

      <div className="flex gap-2 text-[10px] font-mono">
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

      <button
        onClick={handleExport}
        disabled={state.isExporting || enabledFormats.length === 0}
        className="w-full py-2.5 px-3 text-[10px] font-mono uppercase tracking-[0.15em]
          bg-ink text-bg
          hover:bg-bg hover:text-ink
          disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-ink disabled:hover:text-bg
          transition-all duration-200 cursor-pointer"
        style={{ border: '1px solid #0A0A0A' }}
        aria-label={state.isExporting ? 'Exporting...' : `Export ${enabledFormats.length} formats as ZIP`}
      >
        {state.isExporting ? 'Exporting...' : `Generate ${enabledFormats.length} Formats`}
      </button>
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
  return offsetY + lineHeight
}
