import { getCenterCrop } from './cropImage'
import { getTextTheme, getOverlayGradient } from './luminance'

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function fontStr(name) {
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

/**
 * Render a banner to a canvas element.
 * Returns the canvas with the rendered banner.
 */
export function renderBannerCanvas({ format, state, bgImg, logoImg, badgeImg, autoColor, overlayGradient, hFont, tFont, sFont, cFont }) {
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

/**
 * Load all images from state and prepare render parameters.
 * Returns an object with all the params needed for renderBannerCanvas.
 */
export async function prepareRenderParams(state) {
  let bgImg = null
  let logoImg = null
  let badgeImg = null

  if (state.image) bgImg = await loadImage(state.image.src)
  if (state.logo) logoImg = await loadImage(state.logo)
  if (state.activeBadgeSrc) badgeImg = await loadImage(state.activeBadgeSrc)

  const textTheme = state.image ? getTextTheme(state.image.luminance) : 'light'
  const autoColor = textTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
  const overlayGradient = getOverlayGradient(textTheme)

  return {
    bgImg, logoImg, badgeImg, autoColor, overlayGradient,
    hFont: fontStr(state.headlineFont),
    tFont: fontStr(state.taglineFont),
    sFont: fontStr(state.subtextFont),
    cFont: fontStr(state.ctaFont),
  }
}
