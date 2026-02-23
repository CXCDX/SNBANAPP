import { getCenterCrop } from './cropImage'
import { loadImage, fontStr } from './renderCanvas'

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Barlow+Condensed:wght@400;600;700&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap'

/**
 * Generate a self-contained HTML5 banner file.
 * Returns { html: string, sizeKB: number }
 */
export async function generateHTML5Banner({ format, state, bgImg, logoImg, badgeImg, autoColor, overlayGradient }) {
  const { width, height } = format
  const sc = Math.min(width, height) / 1080
  const padding = Math.round(40 * sc)
  const textAreaY = height * 0.50

  // Generate background image as base64 data URI
  let bgDataUrl = ''
  if (bgImg) {
    const formatKey = `${width}x${height}`
    const focusPoint = state.focusPoints?.[formatKey] || { x: 0.5, y: 0.5 }
    const crop = getCenterCrop(bgImg.width, bgImg.height, width, height, focusPoint)
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    const ctx = c.getContext('2d')
    ctx.drawImage(bgImg, crop.sx, crop.sy, crop.sWidth, crop.sHeight, 0, 0, width, height)
    bgDataUrl = c.toDataURL('image/jpeg', 0.7)
  }

  // Logo as base64
  let logoDataUrl = ''
  let logoW = 0
  let logoH = Math.round((state.logoSize || 40) * sc)
  if (logoImg) {
    logoW = logoH * (logoImg.width / logoImg.height)
    const c = document.createElement('canvas')
    c.width = Math.round(logoW)
    c.height = logoH
    const ctx = c.getContext('2d')
    ctx.drawImage(logoImg, 0, 0, c.width, c.height)
    logoDataUrl = c.toDataURL('image/png')
  }

  // Helper: corner position
  function getCornerPos(position, elemW, elemH) {
    switch (position) {
      case 'top-left':     return { left: padding, top: padding }
      case 'top-right':    return { left: width - padding - elemW, top: padding }
      case 'bottom-left':  return { left: padding, top: height - padding - elemH }
      case 'bottom-right': return { left: width - padding - elemW, top: height - padding - elemH }
      default:             return { left: padding, top: padding }
    }
  }

  function getPos(field, defaultLeft, defaultTop) {
    if (state.textPositions?.[field]) {
      return { left: state.textPositions[field].x, top: state.textPositions[field].y }
    }
    return { left: defaultLeft, top: defaultTop }
  }

  // Collect font families used
  const usedFonts = new Set()
  if (state.headline) usedFonts.add(state.headlineFont)
  if (state.tagline) usedFonts.add(state.taglineFont)
  if (state.subtext) usedFonts.add(state.subtextFont)
  if (state.ctaText) usedFonts.add(state.ctaFont)
  const showBadge = state.badgeEnabled || state.badgeLine1 || state.badgeLine2 || state.badgeLine3
  if (showBadge) usedFonts.add(state.badgeFontFamily || 'Barlow Condensed')
  const extras = state.extraTextLayers || []
  for (const layer of extras) {
    if (layer.content) usedFonts.add(layer.font)
  }

  // Build Google Fonts URL with only used fonts
  const fontFamilies = []
  for (const font of usedFonts) {
    if (font === 'Playfair Display') fontFamilies.push('Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500')
    else if (font === 'Barlow Condensed') fontFamilies.push('Barlow+Condensed:wght@400;600;700')
    else if (font === 'DM Sans') fontFamilies.push('DM+Sans:wght@400;500')
    else if (font === 'DM Mono') fontFamilies.push('DM+Mono:wght@400;500')
    else fontFamilies.push(font.replace(/ /g, '+') + ':wght@400;700')
  }
  const fontsUrl = fontFamilies.length > 0
    ? `https://fonts.googleapis.com/css2?${fontFamilies.map(f => `family=${f}`).join('&')}&display=swap`
    : ''

  // Build elements array
  const elements = []

  // Overlay gradient
  if (bgImg) {
    const gradFrom = overlayGradient.from
    const gradTo = overlayGradient.to
    elements.push(`<div style="position:absolute;left:0;top:${Math.round(height * 0.3)}px;width:${width}px;height:${Math.round(height * 0.7)}px;background:linear-gradient(to bottom,${gradTo},${gradFrom});"></div>`)
  }

  // Logo
  if (logoImg && logoDataUrl) {
    const lp = getCornerPos(state.logoPosition, Math.round(logoW), logoH)
    elements.push(`<img src="${logoDataUrl}" style="position:absolute;left:${lp.left}px;top:${lp.top}px;width:${Math.round(logoW)}px;height:${logoH}px;" alt="logo"/>`)
  }

  // Badge designer
  const bpos = state.badgePosition || 'top-right'
  if (showBadge) {
    const scaledSize = Math.round((state.badgeSize || 60) * sc)
    const bp = getCornerPos(bpos, scaledSize, scaledSize)
    // Render badge to a small canvas for precision
    const bc = document.createElement('canvas')
    bc.width = scaledSize
    bc.height = scaledSize
    const bctx = bc.getContext('2d')
    const half = scaledSize / 2
    const rot = (state.badgeRotation || 0) * Math.PI / 180

    bctx.save()
    bctx.translate(half, half)
    bctx.rotate(rot)

    bctx.fillStyle = state.badgeBgColor || '#FF3D57'
    const shape = state.badgeShape || 'circle'
    if (shape === 'circle') {
      bctx.beginPath(); bctx.arc(0, 0, half, 0, Math.PI * 2); bctx.fill()
      if (state.badgeBorderWidth > 0) { bctx.strokeStyle = state.badgeBorderColor || '#FFF'; bctx.lineWidth = state.badgeBorderWidth * sc; bctx.stroke() }
    } else if (shape === 'rectangle') {
      bctx.fillRect(-half, -half, scaledSize, scaledSize)
      if (state.badgeBorderWidth > 0) { bctx.strokeStyle = state.badgeBorderColor || '#FFF'; bctx.lineWidth = state.badgeBorderWidth * sc; bctx.strokeRect(-half, -half, scaledSize, scaledSize) }
    } else if (shape === 'pill') {
      const ph = scaledSize * 0.6; const r = ph / 2
      bctx.beginPath(); bctx.moveTo(-half + r, -ph / 2); bctx.lineTo(half - r, -ph / 2)
      bctx.arc(half - r, 0, r, -Math.PI / 2, Math.PI / 2); bctx.lineTo(-half + r, ph / 2)
      bctx.arc(-half + r, 0, r, Math.PI / 2, -Math.PI / 2); bctx.closePath(); bctx.fill()
      if (state.badgeBorderWidth > 0) { bctx.strokeStyle = state.badgeBorderColor || '#FFF'; bctx.lineWidth = state.badgeBorderWidth * sc; bctx.stroke() }
    } else if (shape === 'starburst') {
      const points = 12; const inner = half * 0.7
      bctx.beginPath()
      for (let i = 0; i < points * 2; i++) {
        const r2 = i % 2 === 0 ? half : inner
        const a = (Math.PI * i) / points - Math.PI / 2
        bctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r2, Math.sin(a) * r2)
      }
      bctx.closePath(); bctx.fill()
      if (state.badgeBorderWidth > 0) { bctx.strokeStyle = state.badgeBorderColor || '#FFF'; bctx.lineWidth = state.badgeBorderWidth * sc; bctx.stroke() }
    }

    const lines = [state.badgeLine1, state.badgeLine2, state.badgeLine3].filter(Boolean)
    if (lines.length > 0) {
      const bfSize = Math.round((state.badgeFontSize || 12) * sc)
      const bfStyle = `${state.badgeBold ? 'bold' : ''} ${state.badgeItalic ? 'italic' : ''}`.trim()
      bctx.font = `${bfStyle || 'normal'} ${bfSize}px "${state.badgeFontFamily || 'Barlow Condensed'}", sans-serif`
      bctx.fillStyle = state.badgeTextColor || '#FFFFFF'
      bctx.textAlign = state.badgeTextAlign || 'center'
      bctx.textBaseline = 'middle'
      const lineH = bfSize * 1.2
      const totalH = lines.length * lineH
      const startY = -totalH / 2 + lineH / 2
      lines.forEach((line, i) => {
        const tx = state.badgeTextAlign === 'left' ? -half + 4 : state.badgeTextAlign === 'right' ? half - 4 : 0
        bctx.fillText(line, tx, startY + i * lineH)
      })
    }
    bctx.restore()
    const badgeDataUrl = bc.toDataURL('image/png')
    elements.push(`<img src="${badgeDataUrl}" style="position:absolute;left:${bp.left}px;top:${bp.top}px;width:${scaledSize}px;height:${scaledSize}px;" alt="badge"/>`)
  } else if (badgeImg) {
    const badgeImgSize = Math.round((state.badgeSize || 60) * sc)
    const bh = badgeImgSize * (badgeImg.height / badgeImg.width)
    const bp = getCornerPos(bpos, badgeImgSize, bh)
    const bc = document.createElement('canvas')
    bc.width = badgeImgSize; bc.height = Math.round(bh)
    const bctx = bc.getContext('2d')
    bctx.drawImage(badgeImg, 0, 0, badgeImgSize, Math.round(bh))
    const badgeDataUrl = bc.toDataURL('image/png')
    elements.push(`<img src="${badgeDataUrl}" style="position:absolute;left:${bp.left}px;top:${bp.top}px;width:${badgeImgSize}px;height:${Math.round(bh)}px;" alt="badge"/>`)
  }

  // Text elements
  let yOff = textAreaY
  const headlineSize = Math.round((state.headlineSize || 48) * sc)
  const taglineSize = Math.round((state.taglineSize || 28) * sc)
  const subtextSize = Math.round((state.subtextSize || 20) * sc)
  const ctaFontSize = Math.round((state.ctaSize || 18) * sc)

  if (state.headline) {
    const pos = getPos('headline', padding, yOff)
    const color = state.headlineColor || autoColor
    elements.push(`<div style="position:absolute;left:${pos.left}px;top:${pos.top}px;width:${width - padding * 2}px;font-family:'${state.headlineFont}',sans-serif;font-size:${headlineSize}px;font-weight:bold;color:${color};line-height:1.1;letter-spacing:2px;word-wrap:break-word;white-space:pre-wrap;">${escapeHtml(state.headline.toUpperCase())}</div>`)
    yOff = pos.top + headlineSize * 1.2 + 6
  }

  if (state.tagline) {
    const pos = getPos('tagline', padding, yOff)
    const color = state.taglineColor || autoColor
    const opacity = state.taglineColor ? 1 : 0.9
    elements.push(`<div style="position:absolute;left:${pos.left}px;top:${pos.top}px;width:${width - padding * 2}px;font-family:'${state.taglineFont}',sans-serif;font-size:${taglineSize}px;font-style:italic;color:${color};opacity:${opacity};line-height:1.3;word-wrap:break-word;white-space:pre-wrap;">${escapeHtml(state.tagline)}</div>`)
    yOff = pos.top + taglineSize * 1.3 + 4
  }

  if (state.subtext) {
    const pos = getPos('subtext', padding, yOff)
    const color = state.subtextColor || autoColor
    const opacity = state.subtextColor ? 1 : 0.8
    elements.push(`<div style="position:absolute;left:${pos.left}px;top:${pos.top}px;width:${width - padding * 2}px;font-family:'${state.subtextFont}',sans-serif;font-size:${subtextSize}px;color:${color};opacity:${opacity};line-height:1.6;word-wrap:break-word;white-space:pre-wrap;">${escapeHtml(state.subtext)}</div>`)
  }

  // Extra text layers
  for (const layer of extras) {
    if (!layer.content) continue
    const layerSize = Math.round((layer.size || 24) * sc)
    const pos = getPos(layer.id, padding, textAreaY + 60 * sc)
    const isHL = layer.type === 'headline'
    const isTL = layer.type === 'tagline'
    const color = layer.color || autoColor
    const opacity = layer.color ? 1 : (isTL ? 0.9 : isHL ? 1 : 0.8)
    const fontWeight = isHL ? 'bold' : 'normal'
    const fontStyle = isTL ? 'italic' : 'normal'
    const content = isHL ? layer.content.toUpperCase() : layer.content
    elements.push(`<div style="position:absolute;left:${pos.left}px;top:${pos.top}px;width:${width - padding * 2}px;font-family:'${layer.font}',sans-serif;font-size:${layerSize}px;font-weight:${fontWeight};font-style:${fontStyle};color:${color};opacity:${opacity};line-height:1.3;word-wrap:break-word;white-space:pre-wrap;">${escapeHtml(content)}</div>`)
  }

  // CTA button
  if (state.ctaText) {
    const pos = getPos('cta', padding, height - padding - ctaFontSize * 2.5)
    const ctaW = Math.max(state.ctaText.length * ctaFontSize * 0.65, 100)
    const ctaH = ctaFontSize * 2.5
    const bgColor = state.ctaColor || '#0A0A0A'
    elements.push(`<div style="position:absolute;left:${pos.left}px;top:${pos.top}px;width:${Math.round(ctaW)}px;height:${Math.round(ctaH)}px;background:${bgColor};display:flex;align-items:center;justify-content:center;font-family:'${state.ctaFont}',sans-serif;font-size:${ctaFontSize}px;font-weight:500;color:#FFFFFF;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(state.ctaText)}</div>`)
  }

  // Brand bar
  elements.push(`<div style="position:absolute;left:0;bottom:0;width:${width}px;height:3px;background:${state.brandColor};"></div>`)

  // Build HTML
  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="ad.size" content="width=${width},height=${height}">
<title>${format.name}</title>
${fontsUrl ? `<link rel="stylesheet" href="${fontsUrl}">` : ''}
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:${width}px;height:${height}px;overflow:hidden;}
.banner{position:relative;width:${width}px;height:${height}px;background:#1E1E1E;overflow:hidden;}
.bg{position:absolute;left:0;top:0;width:${width}px;height:${height}px;object-fit:cover;}
</style>
</head>
<body>
<div class="banner">
${bgDataUrl ? `<img class="bg" src="${bgDataUrl}" alt="background"/>` : ''}
${elements.join('\n')}
</div>
</body>
</html>`

  const sizeBytes = new Blob([html]).size
  const sizeKB = Math.round(sizeBytes / 1024)

  return { html, sizeKB }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>')
}
