import { useCallback, useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { parseCSV, generateTemplate } from '../utils/csvParser'
import { AD_FORMATS, getPlatformFolder } from '../utils/formats'
import { getCenterCrop } from '../utils/cropImage'
import { getTextTheme, getOverlayGradient } from '../utils/luminance'

const BATCH_SIZE = 10

export default function CsvBulkUpload() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const [enabledFormats, setEnabledFormats] = useState(AD_FORMATS.map(f => f.id))
  const cancelRef = useRef(false)

  const onDrop = useCallback((files) => {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = parseCSV(reader.result)
      if (result.error) {
        dispatch({ type: 'ADD_TOAST', payload: { message: result.error, variant: 'error' } })
        return
      }
      dispatch({ type: 'SET_CSV_DATA', payload: { rows: result.rows, fileName: file.name } })
      dispatch({ type: 'ADD_TOAST', payload: { message: `${result.rows.length} rows loaded`, variant: 'success' } })
    }
    reader.readAsText(file)
  }, [dispatch])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    multiple: false,
  })

  const downloadTemplate = () => {
    const csv = generateTemplate()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, 'banner_template.csv')
  }

  const handleGenerate = useCallback(async () => {
    if (!state.csvData || state.csvData.length === 0) return
    const formats = AD_FORMATS.filter(f => enabledFormats.includes(f.id))
    if (formats.length === 0) {
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Select at least one format', variant: 'error' } })
      return
    }

    dispatch({ type: 'SET_EXPORTING', payload: true })
    cancelRef.current = false

    const totalBanners = state.csvData.length * formats.length
    let generated = 0

    try {
      const zip = new JSZip()
      let bgImg = null
      let logoImg = null
      let badgeImg = null

      if (state.image) bgImg = await loadImage(state.image.src)
      if (state.logo) logoImg = await loadImage(state.logo)
      if (state.activeBadgeSrc) badgeImg = await loadImage(state.activeBadgeSrc)

      const textTheme = state.image ? getTextTheme(state.image.luminance) : 'light'
      const autoColor = textTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
      const overlayGradient = getOverlayGradient(textTheme)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')

      const jobs = []
      state.csvData.forEach((row, rowIdx) => {
        formats.forEach(format => {
          jobs.push({ row, rowIdx, format })
        })
      })

      // Batch process
      for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
        if (cancelRef.current) break

        const batch = jobs.slice(i, i + BATCH_SIZE)
        const batchesRemaining = Math.ceil((jobs.length - i - batch.length) / BATCH_SIZE)

        dispatch({
          type: 'SET_EXPORT_PROGRESS',
          payload: { current: generated, total: totalBanners, batches: batchesRemaining },
        })

        const promises = batch.map(async ({ row, rowIdx, format }) => {
          const blob = renderBanner({
            format, row, state, bgImg, logoImg, badgeImg, autoColor, overlayGradient,
          })
          const folder = getPlatformFolder(format.platform)
          const fileName = `SharkNinja_${format.name.replace(/[/\s]+/g, '_')}_v${rowIdx + 1}_${dateStr}.png`
          zip.file(`${folder}/${fileName}`, await blob)
        })

        await Promise.all(promises)
        generated += batch.length

        // Yield to UI
        await new Promise(r => setTimeout(r, 0))
      }

      dispatch({
        type: 'SET_EXPORT_PROGRESS',
        payload: { current: generated, total: totalBanners, batches: 0 },
      })

      if (!cancelRef.current) {
        const content = await zip.generateAsync({ type: 'blob' })
        saveAs(content, `banners_bulk_${dateStr}.zip`)
        dispatch({ type: 'ADD_TOAST', payload: { message: `${generated} banners exported`, variant: 'success' } })
      } else {
        dispatch({ type: 'ADD_TOAST', payload: { message: `Cancelled after ${generated} banners`, variant: 'info' } })
      }
    } catch (err) {
      console.error('Bulk export failed:', err)
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Bulk export failed', variant: 'error' } })
    } finally {
      dispatch({ type: 'SET_EXPORTING', payload: false })
      dispatch({ type: 'SET_EXPORT_PROGRESS', payload: null })
      cancelRef.current = false
    }
  }, [state, enabledFormats, dispatch])

  const handleCancel = () => {
    cancelRef.current = true
  }

  return (
    <div className="space-y-3">
      <h3 className="font-editorial text-[11px] uppercase tracking-[0.08em] text-ink">
        CSV Bulk
      </h3>

      <div
        {...getRootProps()}
        className={`cursor-pointer py-4 text-center transition-opacity ${isDragActive ? 'opacity-50' : ''}`}
        style={{ border: '1px dashed #E0E0DC' }}
      >
        <input {...getInputProps()} />
        <p className="text-[10px] font-mono text-secondary">
          {isDragActive ? 'Drop CSV' : 'Drop CSV or click'}
        </p>
      </div>

      <button
        onClick={downloadTemplate}
        className="text-[9px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer p-0"
      >
        Download CSV Template
      </button>

      {state.csvData && (
        <div className="space-y-2">
          <p className="text-[9px] font-mono text-ink">
            {state.csvFileName} — {state.csvData.length} rows
          </p>

          {/* Preview table */}
          <div className="overflow-x-auto" style={{ maxHeight: '120px' }}>
            <table className="w-full text-[8px] font-mono">
              <thead>
                <tr className="text-left text-secondary">
                  <th className="pr-2 pb-1">#</th>
                  <th className="pr-2 pb-1">headline</th>
                  <th className="pr-2 pb-1">tagline</th>
                  <th className="pr-2 pb-1">cta</th>
                </tr>
              </thead>
              <tbody>
                {state.csvData.slice(0, 5).map((row, i) => (
                  <tr key={i} className="text-ink">
                    <td className="pr-2 py-0.5 text-secondary">{i + 1}</td>
                    <td className="pr-2 py-0.5 truncate max-w-[60px]">{row.headline}</td>
                    <td className="pr-2 py-0.5 truncate max-w-[60px]">{row.tagline}</td>
                    <td className="pr-2 py-0.5 truncate max-w-[40px]">{row.cta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {state.csvData.length > 5 && (
              <p className="text-[8px] font-mono text-secondary mt-1">+{state.csvData.length - 5} more rows</p>
            )}
          </div>

          {/* Progress */}
          {state.exportProgress && (
            <div className="space-y-1">
              <div className="w-full h-1 bg-border">
                <div
                  className="h-1 bg-ink transition-all duration-300"
                  style={{ width: `${(state.exportProgress.current / state.exportProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-[8px] font-mono text-secondary">
                {state.exportProgress.current}/{state.exportProgress.total} banners generated
                {state.exportProgress.batches > 0 && ` — ${state.exportProgress.batches} batches remaining`}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {state.isExporting ? (
              <button
                onClick={handleCancel}
                className="text-[9px] font-mono text-danger hover:underline bg-transparent border-none cursor-pointer p-0"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                className="w-full py-2 px-2 text-[9px] font-mono uppercase tracking-[0.1em] bg-ink text-bg hover:bg-bg hover:text-ink transition-all cursor-pointer"
                style={{ border: '1px solid #0A0A0A' }}
              >
                Generate All ({state.csvData.length} rows &times; {enabledFormats.length} formats)
              </button>
            )}
          </div>

          <button
            onClick={() => dispatch({ type: 'CLEAR_CSV_DATA' })}
            className="text-[9px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer p-0"
          >
            Clear CSV
          </button>
        </div>
      )}
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

function renderBanner({ format, row, state, bgImg, logoImg, badgeImg, autoColor, overlayGradient }) {
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
  const headlineSize = Math.round((state.headlineSize || 48) * sc)
  const taglineSize = Math.round((state.taglineSize || 28) * sc)
  const subtextSize = Math.round((state.subtextSize || 20) * sc)
  const ctaFontSize = Math.round((state.ctaSize || 18) * sc)
  const badgeFontSize = Math.round(14 * sc)
  const logoHeight = Math.round((state.logoSize || 40) * sc)
  const badgeImgSize = Math.round(60 * sc)
  const textAreaY = format.height * 0.50

  const hFont = fontStr(state.headlineFont)
  const tFont = fontStr(state.taglineFont)
  const sFont = fontStr(state.subtextFont)
  const cFont = fontStr(state.ctaFont)

  // Logo
  if (logoImg) {
    const lw = logoHeight * (logoImg.width / logoImg.height)
    const lpos = getCornerPos(state.logoPosition, format.width, format.height, lw, logoHeight, padding)
    ctx.drawImage(logoImg, lpos.x, lpos.y, lw, logoHeight)
  }

  // Badge
  const bpos = state.badgePosition || 'top-right'
  if (badgeImg) {
    const bh = badgeImgSize * (badgeImg.height / badgeImg.width)
    const bp = getCornerPos(bpos, format.width, format.height, badgeImgSize, bh, padding)
    ctx.drawImage(badgeImg, bp.x, bp.y, badgeImgSize, bh)
  } else if (row.badge) {
    const bw = Math.max(row.badge.length * badgeFontSize * 0.65, 60)
    const bh = badgeFontSize * 2.2
    const bp = getCornerPos(bpos, format.width, format.height, bw, bh, padding)
    ctx.fillStyle = state.brandColor
    ctx.fillRect(bp.x, bp.y, bw, bh)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${badgeFontSize}px ${hFont}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(row.badge, bp.x + bw / 2, bp.y + bh / 2)
  }

  let yOff = textAreaY

  if (row.headline) {
    ctx.fillStyle = state.headlineColor || autoColor
    ctx.font = `bold ${headlineSize}px ${hFont}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    yOff = wrapText(ctx, row.headline.toUpperCase(), padding, yOff, format.width - padding * 2, headlineSize * 1.1)
    yOff += 6
  }

  if (row.tagline) {
    ctx.fillStyle = state.taglineColor || autoColor
    ctx.globalAlpha = state.taglineColor ? 1 : 0.9
    ctx.font = `italic ${taglineSize}px ${tFont}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    yOff = wrapText(ctx, row.tagline, padding, yOff, format.width - padding * 2, taglineSize * 1.3)
    yOff += 4
    ctx.globalAlpha = 1
  }

  if (row.subtext) {
    ctx.fillStyle = state.subtextColor || autoColor
    ctx.globalAlpha = state.subtextColor ? 1 : 0.8
    ctx.font = `${subtextSize}px ${sFont}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    wrapText(ctx, row.subtext, padding, yOff, format.width - padding * 2, subtextSize * 1.6)
    ctx.globalAlpha = 1
  }

  if (row.cta) {
    const ctaW = Math.max(row.cta.length * ctaFontSize * 0.65, 100)
    const ctaH = ctaFontSize * 2.5
    const ctaY = format.height - padding - ctaH
    ctx.fillStyle = state.ctaColor || '#0A0A0A'
    ctx.fillRect(padding, ctaY, ctaW, ctaH)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `500 ${ctaFontSize}px ${cFont}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(row.cta.toUpperCase(), padding + ctaW / 2, ctaY + ctaH / 2)
  }

  ctx.fillStyle = state.brandColor
  ctx.fillRect(0, format.height - 3, format.width, 3)

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
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
