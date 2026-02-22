import { useRef, useEffect, useState, useMemo } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group } from 'react-konva'
import { useAppState } from '../store/AppContext'
import { getCenterCrop } from '../utils/cropImage'
import { getTextTheme, getOverlayGradient } from '../utils/luminance'

function getCornerPos(position, canvasW, canvasH, elemW, elemH, padding) {
  switch (position) {
    case 'top-left':     return { x: padding, y: padding }
    case 'top-right':    return { x: canvasW - padding - elemW, y: padding }
    case 'bottom-left':  return { x: padding, y: canvasH - padding - elemH }
    case 'bottom-right': return { x: canvasW - padding - elemW, y: canvasH - padding - elemH }
    default:             return { x: padding, y: padding }
  }
}

export default function BannerCanvas({ format, scale = 1 }) {
  const {
    image, headline, tagline, subtext, ctaText, badge, logo, brandColor,
    headlineFont, headlineColor, headlineSize,
    taglineFont, taglineColor, taglineSize,
    subtextFont, subtextColor, subtextSize,
    ctaFont, ctaColor, ctaSize,
    activeBadgeSrc, focusPoints,
    logoPosition, logoSize, badgePosition,
  } = useAppState()

  const formatKey = `${format.width}x${format.height}`
  const focusPoint = focusPoints[formatKey] || { x: 0.5, y: 0.5 }
  const stageRef = useRef(null)
  const [bgImage, setBgImage] = useState(null)
  const [logoImage, setLogoImage] = useState(null)
  const [badgeImage, setBadgeImage] = useState(null)

  const { width, height } = format
  const displayWidth = width * scale
  const displayHeight = height * scale

  useEffect(() => {
    if (!image) { setBgImage(null); return }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setBgImage(img)
    img.src = image.src
  }, [image])

  useEffect(() => {
    if (!logo) { setLogoImage(null); return }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setLogoImage(img)
    img.src = logo
  }, [logo])

  useEffect(() => {
    if (!activeBadgeSrc) { setBadgeImage(null); return }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setBadgeImage(img)
    img.src = activeBadgeSrc
  }, [activeBadgeSrc])

  const textTheme = useMemo(() => {
    if (!image) return 'light'
    return getTextTheme(image.luminance)
  }, [image])

  const autoTextColor = textTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
  const overlayGradient = useMemo(() => getOverlayGradient(textTheme), [textTheme])

  const crop = useMemo(() => {
    if (!bgImage) return null
    return getCenterCrop(bgImage.width, bgImage.height, width, height, focusPoint)
  }, [bgImage, width, height, focusPoint])

  const s = Math.min(width, height) / 1080
  const hSize = Math.round((headlineSize || 48) * s)
  const tSize = Math.round((taglineSize || 28) * s)
  const sSize = Math.round((subtextSize || 20) * s)
  const cSize = Math.round((ctaSize || 18) * s)
  const badgeFontSize = Math.round(14 * s)
  const logoH = Math.round((logoSize || 40) * s)
  const padding = Math.round(40 * s)
  const badgeImgSize = Math.round(60 * s)
  const textAreaY = height * 0.50

  const headlineEndY = headline ? textAreaY + hSize * 1.2 + 6 : textAreaY
  const taglineEndY = tagline ? headlineEndY + tSize * 1.3 + 4 : headlineEndY
  const subtextStartY = taglineEndY + 4

  return (
    <Stage
      ref={stageRef}
      width={displayWidth}
      height={displayHeight}
      scaleX={scale}
      scaleY={scale}
      aria-label={`Banner preview for ${format.name}`}
    >
      <Layer>
        <Rect width={width} height={height} fill="#1E1E1E" />

        {bgImage && crop && (
          <KonvaImage
            image={bgImage}
            x={0} y={0} width={width} height={height}
            crop={{ x: crop.sx, y: crop.sy, width: crop.sWidth, height: crop.sHeight }}
          />
        )}

        {bgImage && (
          <Rect
            x={0} y={height * 0.3} width={width} height={height * 0.7}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: height * 0.7 }}
            fillLinearGradientColorStops={[0, overlayGradient.to, 1, overlayGradient.from]}
          />
        )}

        {/* Badge image from library — positioned */}
        {badgeImage && (() => {
          const bh = badgeImgSize * (badgeImage.height / badgeImage.width)
          const bp = getCornerPos(badgePosition, width, height, badgeImgSize, bh, padding)
          return <KonvaImage image={badgeImage} x={bp.x} y={bp.y} width={badgeImgSize} height={bh} />
        })()}

        {/* Badge text fallback — positioned */}
        {badge && !badgeImage && (() => {
          const bw = Math.max(badge.length * badgeFontSize * 0.65, 60)
          const bh = badgeFontSize * 2.2
          const bp = getCornerPos(badgePosition, width, height, bw, bh, padding)
          return (
            <Group x={bp.x} y={bp.y}>
              <Rect width={bw} height={bh} fill={brandColor} />
              <Text
                text={badge} width={bw} height={bh}
                align="center" verticalAlign="middle"
                fontSize={badgeFontSize} fontFamily={headlineFont} fontStyle="bold" fill="#FFFFFF"
              />
            </Group>
          )
        })()}

        {/* Logo — positioned */}
        {logoImage && (() => {
          const lw = logoH * (logoImage.width / logoImage.height)
          const lp = getCornerPos(logoPosition, width, height, lw, logoH, padding)
          return <KonvaImage image={logoImage} x={lp.x} y={lp.y} height={logoH} width={lw} />
        })()}

        {headline && (
          <Text
            text={headline.toUpperCase()}
            x={padding} y={textAreaY} width={width - padding * 2}
            fontSize={hSize}
            fontFamily={headlineFont}
            fontStyle="bold"
            fill={headlineColor || autoTextColor}
            lineHeight={1.1} letterSpacing={2} wrap="word"
          />
        )}

        {tagline && (
          <Text
            text={tagline}
            x={padding} y={headlineEndY} width={width - padding * 2}
            fontSize={tSize}
            fontFamily={taglineFont}
            fontStyle="italic"
            fill={taglineColor || autoTextColor}
            opacity={taglineColor ? 1 : 0.9}
            lineHeight={1.3} wrap="word"
          />
        )}

        {subtext && (
          <Text
            text={subtext}
            x={padding} y={subtextStartY} width={width - padding * 2}
            fontSize={sSize}
            fontFamily={subtextFont}
            fill={subtextColor || autoTextColor}
            opacity={subtextColor ? 1 : 0.8}
            lineHeight={1.6} wrap="word"
          />
        )}

        {ctaText && (
          <Group x={padding} y={height - padding - cSize * 2.8}>
            <Rect
              width={Math.max(ctaText.length * cSize * 0.65, 100)}
              height={cSize * 2.5}
              fill={ctaColor || '#0A0A0A'}
            />
            <Text
              text={ctaText.toUpperCase()}
              width={Math.max(ctaText.length * cSize * 0.65, 100)}
              height={cSize * 2.5}
              align="center" verticalAlign="middle"
              fontSize={cSize}
              fontFamily={ctaFont}
              fontStyle="500"
              fill="#FFFFFF"
              letterSpacing={1}
            />
          </Group>
        )}

        <Rect x={0} y={height - 3} width={width} height={3} fill={brandColor} />
      </Layer>
    </Stage>
  )
}
