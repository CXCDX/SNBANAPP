/**
 * Smart center-focus crop: compute source region for a given target aspect ratio.
 * Returns { sx, sy, sWidth, sHeight } for canvas drawImage.
 */
export function getCenterCrop(imgWidth, imgHeight, targetWidth, targetHeight) {
  const targetRatio = targetWidth / targetHeight
  const imgRatio = imgWidth / imgHeight

  let sWidth, sHeight, sx, sy

  if (imgRatio > targetRatio) {
    // Image is wider — crop sides
    sHeight = imgHeight
    sWidth = imgHeight * targetRatio
    sx = (imgWidth - sWidth) / 2
    sy = 0
  } else {
    // Image is taller — crop top/bottom
    sWidth = imgWidth
    sHeight = imgWidth / targetRatio
    sx = 0
    sy = (imgHeight - sHeight) / 2
  }

  return { sx, sy, sWidth, sHeight }
}
