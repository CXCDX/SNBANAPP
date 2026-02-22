/**
 * Analyze average luminance of an image.
 * Returns a value 0–255 where 0 = pure black, 255 = pure white.
 */
export function getImageLuminance(imgElement) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const sampleSize = 100
  canvas.width = sampleSize
  canvas.height = sampleSize
  ctx.drawImage(imgElement, 0, 0, sampleSize, sampleSize)

  const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
  const data = imageData.data
  let totalLuminance = 0
  const pixelCount = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    // Rec. 709 luminance
    totalLuminance += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
  }

  return totalLuminance / pixelCount
}

/**
 * Determine if text should be light or dark based on image luminance.
 * Returns 'light' or 'dark' theme for text overlay.
 */
export function getTextTheme(luminance) {
  return luminance > 128 ? 'dark' : 'light'
}

/**
 * Get gradient direction/color for overlay based on luminance.
 */
export function getOverlayGradient(theme) {
  if (theme === 'light') {
    // Image is bright → dark overlay for light text
    return { from: 'rgba(0,0,0,0.7)', to: 'rgba(0,0,0,0.0)' }
  }
  // Image is dark → keep dark, subtle gradient from bottom
  return { from: 'rgba(0,0,0,0.5)', to: 'rgba(0,0,0,0.0)' }
}
