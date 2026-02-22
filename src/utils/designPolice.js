/**
 * AI Design Police — Rule-based validation engine.
 * Zero external API calls. Pure JavaScript.
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
 * @returns {Array<{ level: 'error'|'warning'|'pass', message: string, field?: string }>}
 */
export function runDesignChecks(state, canvas, format) {
  const issues = []

  // === TEXT RULES ===
  if (!state.headline && !state.subtext) {
    issues.push({ level: 'error', message: 'No copy added', field: 'text' })
  }

  if (state.headline && state.headline.length > 30) {
    issues.push({ level: 'error', message: `Headline exceeds Google Ads limit (${state.headline.length}/30)`, field: 'headline' })
  }

  if (state.subtext && state.subtext.length > 90) {
    issues.push({ level: 'error', message: `Description exceeds Google Ads limit (${state.subtext.length}/90)`, field: 'subtext' })
  }

  const allText = [state.headline, state.tagline, state.subtext, state.ctaText, state.badge].join(' ')
  if (/!!|!{2,}|\?\?|\?{2,}/.test(allText)) {
    issues.push({ level: 'warning', message: 'Avoid repeated punctuation', field: 'text' })
  }

  const productPatterns = /premier series|3-in-1 max|duoclean|flexology|hydrovac|ionflex/i
  if (productPatterns.test(allText)) {
    issues.push({ level: 'warning', message: 'Use product nickname — avoid full product name', field: 'text' })
  }

  // === VISUAL RULES ===
  if (!state.image) {
    issues.push({ level: 'error', message: 'No background image', field: 'image' })
  }

  if (canvas && format) {
    const s = Math.min(format.width, format.height) / 1080
    const padding = Math.round(40 * s)
    const textAreaY = format.height * 0.50

    // Contrast check for headline
    if (state.headline) {
      const textColor = state.headlineColor || (state.image && state.image.luminance > 128 ? '#1A1A1A' : '#F5F5F5')
      const headlineSize = Math.round(48 * s)
      const bgColor = getDominantColor(canvas, {
        x: padding, y: textAreaY,
        width: Math.min(format.width - padding * 2, 300),
        height: headlineSize * 1.5,
      })
      const ratio = contrastRatio(hexToRgb(textColor), bgColor)
      if (ratio < 4.5) {
        issues.push({
          level: 'error',
          message: `Text contrast fails WCAG AA (current: ${ratio.toFixed(1)}:1)`,
          field: 'headline',
        })
      }
    }

    // Text safe zone check (inner 85%)
    const safeMarginX = format.width * 0.075
    const safeMarginY = format.height * 0.075
    if (padding < safeMarginX || padding < safeMarginY) {
      issues.push({ level: 'error', message: 'Text outside platform safe zone', field: 'layout' })
    }

    // Logo safe zone (inner 90%)
    if (state.logo) {
      const logoMarginX = format.width * 0.05
      const logoMarginY = format.height * 0.05
      if (padding < logoMarginX || padding < logoMarginY) {
        issues.push({ level: 'warning', message: 'Logo too close to edge', field: 'logo' })
      }
    }
  }

  // === BRAND RULES ===
  if (!state.logo) {
    issues.push({ level: 'warning', message: 'No brand logo applied', field: 'logo' })
  }

  if (state.badge && state.badge.length > 20) {
    issues.push({ level: 'warning', message: 'Badge text too long', field: 'badge' })
  }

  // If no issues, add a pass
  if (issues.length === 0) {
    issues.push({ level: 'pass', message: 'All checks passed' })
  }

  return issues
}
