/**
 * Focus-point crop: compute source region for a given target aspect ratio,
 * centered on the user-defined focus point (fx, fy in 0–1 range).
 * Returns { sx, sy, sWidth, sHeight } for canvas drawImage.
 */
export function getCenterCrop(imgWidth, imgHeight, targetWidth, targetHeight, focusPoint) {
  const fx = focusPoint?.x ?? 0.5
  const fy = focusPoint?.y ?? 0.5
  const targetRatio = targetWidth / targetHeight
  const imgRatio = imgWidth / imgHeight

  let sWidth, sHeight, sx, sy

  if (imgRatio > targetRatio) {
    // Image is wider — crop sides
    sHeight = imgHeight
    sWidth = imgHeight * targetRatio
    // Center crop on focus X, clamped to image bounds
    sx = Math.max(0, Math.min(fx * imgWidth - sWidth / 2, imgWidth - sWidth))
    sy = 0
  } else {
    // Image is taller — crop top/bottom
    sWidth = imgWidth
    sHeight = imgWidth / targetRatio
    sx = 0
    // Center crop on focus Y, clamped to image bounds
    sy = Math.max(0, Math.min(fy * imgHeight - sHeight / 2, imgHeight - sHeight))
  }

  return { sx, sy, sWidth, sHeight }
}
