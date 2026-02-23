/**
 * AI Design Police — Rule-based validation engine.
 * Zero external API calls. Pure JavaScript.
 *
 * Rules:
 *   CONTRAST  — Text vs background contrast (WCAG)
 *   SAFEZONE  — Text within 5% margin
 *   CTA       — CTA button presence
 *   OVERLAP   — Badge/text overlap
 *   FONTS     — Font consistency (max 5 families)
 *   IMAGE     — Background image required
 */

/**
 * Sample dominant color from a canvas region.
 * Returns { r, g, b } average.
 */
export function getDominantColor(canvas, region) {
  const ctx = canvas.getContext('2d')
  const { x, y, width, height } = region
  const sx = Math.max(0, Math.round(x))
  const sy = Math.max(0, Math.round(y))
  const sw = Math.min(Math.round(width), canvas.width - sx)
  const sh = Math.min(Math.round(height), canvas.height - sy)
  if (sw <= 0 || sh <= 0) return { r: 30, g: 30, b: 30 }

  const imageData = ctx.getImageData(sx, sy, sw, sh)
  const data = imageData.data
  let r = 0, g = 0, b = 0
  const count = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
  }

  return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) }
}

/**
 * Relative luminance (WCAG 2.0)
 */
function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  )
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * WCAG contrast ratio between two colors.
 */
export function contrastRatio(color1, color2) {
  const l1 = relativeLuminance(color1)
  const l2 = relativeLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 245, g: 245, b: 245 }
}

/**
 * Compute text element positions & sizes for rule checks.
 * Returns array of { field, x, y, w, h, fontSize, color, label }
 */
function getTextElements(state, format) {
  const sc = Math.min(format.width, format.height) / 1080
  const padding = Math.round(40 * sc)
  const textAreaY = format.height * 0.50
  const autoColor = state.image && state.image.luminance > 128 ? '#1A1A1A' : '#F5F5F5'

  const elements = []

  const getPos = (field, defaultX, defaultY) => {
    if (state.textPositions?.[field]) return state.textPositions[field]
    return { x: defaultX, y: defaultY }
  }

  let yOff = textAreaY

  if (state.headline) {
    const hSize = Math.round((state.headlineSize || 48) * sc)
    const pos = getPos('headline', padding, yOff)
    elements.push({
      field: 'headline', label: 'Headline',
      x: pos.x, y: pos.y,
      w: format.width - padding * 2, h: hSize * 1.5,
      fontSize: hSize,
      color: state.headlineColor || autoColor,
      font: state.headlineFont,
    })
    yOff = pos.y + hSize * 1.2 + 6
  }

  if (state.tagline) {
    const tSize = Math.round((state.taglineSize || 28) * sc)
    const pos = getPos('tagline', padding, yOff)
    elements.push({
      field: 'tagline', label: 'Tagline',
      x: pos.x, y: pos.y,
      w: format.width - padding * 2, h: tSize * 1.5,
      fontSize: tSize,
      color: state.taglineColor || autoColor,
      font: state.taglineFont,
    })
    yOff = pos.y + tSize * 1.3 + 4
  }

  if (state.subtext) {
    const sSize = Math.round((state.subtextSize || 20) * sc)
    const pos = getPos('subtext', padding, yOff)
    elements.push({
      field: 'subtext', label: 'Subtext',
      x: pos.x, y: pos.y,
      w: format.width - padding * 2, h: sSize * 2,
      fontSize: sSize,
      color: state.subtextColor || autoColor,
      font: state.subtextFont,
    })
  }

  if (state.ctaText) {
    const cSize = Math.round((state.ctaSize || 18) * sc)
    const pos = getPos('cta', padding, format.height - padding - cSize * 2.5)
    const ctaW = Math.max(state.ctaText.length * cSize * 0.65, 100)
    elements.push({
      field: 'cta', label: 'CTA',
      x: pos.x, y: pos.y,
      w: ctaW, h: cSize * 2.5,
      fontSize: cSize,
      color: state.ctaColor || '#0A0A0A',
      font: state.ctaFont,
    })
  }

  // Extra text layers
  const extras = state.extraTextLayers || []
  for (const layer of extras) {
    if (!layer.content) continue
    const layerSize = Math.round((layer.size || 24) * sc)
    const pos = getPos(layer.id, padding, textAreaY + 60 * sc)
    elements.push({
      field: layer.id, label: `${layer.type} layer`,
      x: pos.x, y: pos.y,
      w: format.width - padding * 2, h: layerSize * 1.5,
      fontSize: layerSize,
      color: layer.color || autoColor,
      font: layer.font,
    })
  }

  return elements
}

/**
 * Get badge bounding box.
 */
function getBadgeRect(state, format) {
  const sc = Math.min(format.width, format.height) / 1080
  const padding = Math.round(40 * sc)
  const bpos = state.badgePosition || 'top-right'
  const scaledSize = Math.round((state.badgeSize || 60) * sc)

  const showBadge = state.badgeEnabled || state.badgeLine1 || state.badgeLine2 || state.badgeLine3
  const hasBadgeImg = !!state.activeBadgeSrc
  const hasOldBadge = !!state.badge

  if (!showBadge && !hasBadgeImg && !hasOldBadge) return null

  let bw = scaledSize
  let bh = scaledSize

  switch (bpos) {
    case 'top-left':     return { x: padding, y: padding, w: bw, h: bh }
    case 'top-right':    return { x: format.width - padding - bw, y: padding, w: bw, h: bh }
    case 'bottom-left':  return { x: padding, y: format.height - padding - bh, w: bw, h: bh }
    case 'bottom-right': return { x: format.width - padding - bw, y: format.height - padding - bh, w: bw, h: bh }
    default:             return { x: padding, y: padding, w: bw, h: bh }
  }
}

/**
 * Check if two rectangles overlap.
 */
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/**
 * Run all design police checks.
 * @param {Object} state - App state
 * @param {HTMLCanvasElement|null} canvas - Rendered canvas for visual checks
 * @param {Object} format - Current format { width, height }
 * @returns {Array<{ code, level, message, category, field? }>}
 */
export function runDesignChecks(state, canvas, format) {
  const issues = []
  const textElements = format ? getTextElements(state, format) : []

  // ========== IMAGE ==========
  if (!state.image) {
    issues.push({ code: 'IMAGE_001', level: 'error', message: 'Arka plan görseli yüklenmedi', category: 'visual', field: 'image' })
  } else {
    issues.push({ code: 'IMAGE_001', level: 'pass', message: 'Arka plan görseli mevcut', category: 'visual' })
  }

  // ========== TEXT CONTRAST ==========
  if (canvas && format) {
    for (const elem of textElements) {
      if (elem.field === 'cta') continue // CTA has its own bg box
      const bgColor = getDominantColor(canvas, {
        x: elem.x, y: elem.y,
        width: Math.min(elem.w, 400),
        height: elem.h,
      })
      const textRgb = hexToRgb(elem.color)
      const ratio = contrastRatio(textRgb, bgColor)
      // Large text: fontSize >= 24px (18pt) → 3:1 minimum
      // Small text: < 24px → 4.5:1 minimum
      const isLarge = elem.fontSize >= 24
      const threshold = isLarge ? 3.0 : 4.5

      if (ratio < threshold) {
        issues.push({
          code: 'CONTRAST',
          level: 'warning',
          message: `Metin okunaksız — kontrast yetersiz (${elem.label}: ${ratio.toFixed(1)}:1, min ${threshold}:1)`,
          category: 'visual',
          field: elem.field,
        })
      } else {
        issues.push({
          code: 'CONTRAST',
          level: 'pass',
          message: `${elem.label} kontrast OK (${ratio.toFixed(1)}:1)`,
          category: 'visual',
        })
      }
    }
  }

  // ========== SAFE ZONE (5% margin) ==========
  if (format) {
    const marginX = format.width * 0.05
    const marginY = format.height * 0.05
    const safeRight = format.width - marginX
    const safeBottom = format.height - marginY

    for (const elem of textElements) {
      const outsideLeft = elem.x < marginX
      const outsideTop = elem.y < marginY
      const outsideRight = elem.x + elem.w > safeRight
      const outsideBottom = elem.y + elem.h > safeBottom

      if (outsideLeft || outsideTop || outsideRight || outsideBottom) {
        issues.push({
          code: 'SAFEZONE',
          level: 'warning',
          message: `Metin güvenli alan dışında (${elem.label})`,
          category: 'visual',
          field: elem.field,
        })
      }
    }
    // If all are safe
    const safeCount = textElements.filter(el => {
      return el.x >= marginX && el.y >= marginY &&
        el.x + el.w <= safeRight && el.y + el.h <= safeBottom
    }).length
    if (safeCount === textElements.length && textElements.length > 0) {
      issues.push({ code: 'SAFEZONE', level: 'pass', message: 'Tüm metinler güvenli alanda', category: 'visual' })
    }
  }

  // ========== CTA BUTTON ==========
  if (!state.ctaText) {
    issues.push({ code: 'CTA', level: 'warning', message: 'CTA butonu eksik', category: 'visual', field: 'cta' })
  } else {
    issues.push({ code: 'CTA', level: 'pass', message: 'CTA butonu mevcut', category: 'visual' })
  }

  // ========== BADGE / TEXT OVERLAP ==========
  if (format) {
    const badgeRect = getBadgeRect(state, format)
    if (badgeRect) {
      let hasOverlap = false
      for (const elem of textElements) {
        if (rectsOverlap(badgeRect, { x: elem.x, y: elem.y, w: elem.w, h: elem.h })) {
          hasOverlap = true
          issues.push({
            code: 'OVERLAP',
            level: 'warning',
            message: `Rozet metin üzerine biniyor (${elem.label})`,
            category: 'visual',
            field: elem.field,
          })
        }
      }
      if (!hasOverlap) {
        issues.push({ code: 'OVERLAP', level: 'pass', message: 'Rozet ve metin örtüşmüyor', category: 'visual' })
      }
    }
  }

  // ========== FONT CONSISTENCY (max 5 families) ==========
  const fonts = new Set()
  if (state.headline) fonts.add(state.headlineFont)
  if (state.tagline) fonts.add(state.taglineFont)
  if (state.subtext) fonts.add(state.subtextFont)
  if (state.ctaText) fonts.add(state.ctaFont)
  const extras = state.extraTextLayers || []
  for (const layer of extras) {
    if (layer.content) fonts.add(layer.font)
  }
  if (fonts.size > 5) {
    issues.push({
      code: 'FONTS',
      level: 'warning',
      message: `Çok fazla font ailesi kullanıldı (${fonts.size}/5)`,
      category: 'brand',
    })
  } else if (fonts.size > 0) {
    issues.push({ code: 'FONTS', level: 'pass', message: `Font sayısı uygun (${fonts.size}/5)`, category: 'brand' })
  }

  // ========== COPY PRESENT ==========
  const hasAnyText = state.headline || state.subtext || extras.some(l => l.content)
  if (!hasAnyText) {
    issues.push({ code: 'TEXT', level: 'error', message: 'Metin eklenmedi — başlık veya açıklama ekleyin', category: 'text', field: 'text' })
  } else {
    issues.push({ code: 'TEXT', level: 'pass', message: 'Metin mevcut', category: 'text' })
  }

  return issues
}
