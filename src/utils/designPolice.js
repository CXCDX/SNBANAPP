/**
 * AI Design Police — Rule-based validation engine.
 * Zero external API calls. Pure JavaScript.
 *
 * Rules are organized by category:
 *   TEXT_001–005  — Copy & text validation
 *   VISUAL_001–004 — Layout & visual validation
 *   BRAND_001–002  — Brand compliance
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
function contrastRatio(color1, color2) {
  const l1 = relativeLuminance(color1)
  const l2 = relativeLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 245, g: 245, b: 245 }
}

/**
 * Run all design police checks.
 * @param {Object} state - App state
 * @param {HTMLCanvasElement|null} canvas - Rendered canvas for visual checks
 * @param {Object} format - Current format { width, height }
 * @returns {Array<{ code: string, level: 'error'|'warning'|'pass', message: string, category: string, field?: string }>}
 */
export function runDesignChecks(state, canvas, format) {
  const issues = []

  // ========== TEXT RULES ==========

  // TEXT_001: Must have at least headline or subtext
  if (!state.headline && !state.subtext) {
    issues.push({ code: 'TEXT_001', level: 'error', message: 'No copy added — add a headline or description', category: 'text', field: 'text' })
  } else {
    issues.push({ code: 'TEXT_001', level: 'pass', message: 'Copy present', category: 'text' })
  }

  // TEXT_002: Headline character limit (Google Ads = 30)
  if (state.headline && state.headline.length > 30) {
    issues.push({ code: 'TEXT_002', level: 'error', message: `Headline exceeds 30 chars (${state.headline.length}/30)`, category: 'text', field: 'headline' })
  } else if (state.headline) {
    issues.push({ code: 'TEXT_002', level: 'pass', message: `Headline length OK (${state.headline.length}/30)`, category: 'text' })
  }

  // TEXT_003: Description character limit (Google Ads = 90)
  if (state.subtext && state.subtext.length > 90) {
    issues.push({ code: 'TEXT_003', level: 'error', message: `Description exceeds 90 chars (${state.subtext.length}/90)`, category: 'text', field: 'subtext' })
  } else if (state.subtext) {
    issues.push({ code: 'TEXT_003', level: 'pass', message: `Description length OK (${state.subtext.length}/90)`, category: 'text' })
  }

  // TEXT_004: Avoid repeated punctuation
  const allText = [state.headline, state.tagline, state.subtext, state.ctaText, state.badge].filter(Boolean).join(' ')
  if (/!!|!{2,}|\?\?|\?{2,}|\.{4,}/.test(allText)) {
    issues.push({ code: 'TEXT_004', level: 'warning', message: 'Avoid repeated punctuation (!! or ?? or ....)', category: 'text', field: 'text' })
  } else if (allText.length > 0) {
    issues.push({ code: 'TEXT_004', level: 'pass', message: 'Punctuation OK', category: 'text' })
  }

  // TEXT_005: Avoid full product names (use nickname)
  const productPatterns = /premier series|3-in-1 max|duoclean|flexology|hydrovac|ionflex|speedflex|liftaway|rotator|navigator|stratos/i
  if (productPatterns.test(allText)) {
    issues.push({ code: 'TEXT_005', level: 'warning', message: 'Use product nickname — avoid full product name in ads', category: 'text', field: 'text' })
  } else if (allText.length > 0) {
    issues.push({ code: 'TEXT_005', level: 'pass', message: 'No full product names detected', category: 'text' })
  }

  // ========== VISUAL RULES ==========

  // VISUAL_001: Must have background image
  if (!state.image) {
    issues.push({ code: 'VISUAL_001', level: 'error', message: 'No background image uploaded', category: 'visual', field: 'image' })
  } else {
    issues.push({ code: 'VISUAL_001', level: 'pass', message: 'Background image present', category: 'visual' })
  }

  // VISUAL_002: Headline contrast (WCAG AA ≥ 4.5:1)
  if (canvas && format && state.headline) {
    const s = Math.min(format.width, format.height) / 1080
    const padding = Math.round(40 * s)
    const textAreaY = format.height * 0.50
    const headlineSize = Math.round((state.headlineSize || 48) * s)

    const textColor = state.headlineColor || (state.image && state.image.luminance > 128 ? '#1A1A1A' : '#F5F5F5')
    const bgColor = getDominantColor(canvas, {
      x: padding, y: textAreaY,
      width: Math.min(format.width - padding * 2, 300),
      height: headlineSize * 1.5,
    })
    const ratio = contrastRatio(hexToRgb(textColor), bgColor)
    if (ratio < 3.0) {
      issues.push({ code: 'VISUAL_002', level: 'error', message: `Headline contrast too low (${ratio.toFixed(1)}:1, need ≥4.5:1)`, category: 'visual', field: 'headline' })
    } else if (ratio < 4.5) {
      issues.push({ code: 'VISUAL_002', level: 'warning', message: `Headline contrast borderline (${ratio.toFixed(1)}:1, recommend ≥4.5:1)`, category: 'visual', field: 'headline' })
    } else {
      issues.push({ code: 'VISUAL_002', level: 'pass', message: `Headline contrast OK (${ratio.toFixed(1)}:1)`, category: 'visual' })
    }
  }

  // VISUAL_003: Text safe zone (inner 85%)
  if (canvas && format) {
    const s = Math.min(format.width, format.height) / 1080
    const padding = Math.round(40 * s)
    const safeMarginX = format.width * 0.075
    const safeMarginY = format.height * 0.075
    if (padding < safeMarginX || padding < safeMarginY) {
      issues.push({ code: 'VISUAL_003', level: 'error', message: 'Text may fall outside platform safe zone (inner 85%)', category: 'visual', field: 'layout' })
    } else {
      issues.push({ code: 'VISUAL_003', level: 'pass', message: 'Text within safe zone', category: 'visual' })
    }
  }

  // VISUAL_004: CTA button present and readable
  if (!state.ctaText) {
    issues.push({ code: 'VISUAL_004', level: 'warning', message: 'No CTA button — consider adding a call-to-action', category: 'visual', field: 'cta' })
  } else if (state.ctaText.length > 20) {
    issues.push({ code: 'VISUAL_004', level: 'warning', message: `CTA text too long (${state.ctaText.length} chars) — keep under 20`, category: 'visual', field: 'cta' })
  } else {
    issues.push({ code: 'VISUAL_004', level: 'pass', message: 'CTA present and concise', category: 'visual' })
  }

  // ========== BRAND RULES ==========

  // BRAND_001: Logo present
  if (!state.logo) {
    issues.push({ code: 'BRAND_001', level: 'warning', message: 'No brand logo applied', category: 'brand', field: 'logo' })
  } else {
    issues.push({ code: 'BRAND_001', level: 'pass', message: 'Brand logo present', category: 'brand' })

    // Logo safe zone check
    if (canvas && format) {
      const s = Math.min(format.width, format.height) / 1080
      const padding = Math.round(40 * s)
      const logoMarginX = format.width * 0.05
      const logoMarginY = format.height * 0.05
      if (padding < logoMarginX || padding < logoMarginY) {
        issues.push({ code: 'BRAND_001b', level: 'warning', message: 'Logo too close to edge', category: 'brand', field: 'logo' })
      }
    }
  }

  // BRAND_002: Badge text length
  if (state.badge && state.badge.length > 20) {
    issues.push({ code: 'BRAND_002', level: 'warning', message: `Badge text too long (${state.badge.length} chars)`, category: 'brand', field: 'badge' })
  } else if (state.badge) {
    issues.push({ code: 'BRAND_002', level: 'pass', message: 'Badge text length OK', category: 'brand' })
  }

  return issues
}
