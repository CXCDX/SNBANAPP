import { useRef, useEffect, useState, useMemo } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group, Circle, Star } from 'react-konva'
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

function BadgeDesigner({ x, y, size, shape, bgColor, textColor, borderColor, borderWidth, fontFamily, fontSize, bold, italic, textAlign, line1, line2, line3, rotation, scale: s }) {
  const scaledSize = Math.round(size * s)
  const scaledFontSize = Math.round(fontSize * s)
  const lines = [line1, line2, line3].filter(Boolean)
  const text = lines.join('\n')
  const fontStyle = `${bold ? 'bold' : ''} ${italic ? 'italic' : ''}`.trim() || 'normal'
  const half = scaledSize / 2

  return (
    <Group x={x + half} y={y + half} rotation={rotation}>
      {shape === 'circle' && (
        <Circle
          x={0} y={0}
          radius={half}
          fill={bgColor}
          stroke={borderWidth > 0 ? borderColor : undefined}
          strokeWidth={borderWidth * s}
        />
      )}
      {shape === 'rectangle' && (
        <Rect
          x={-half} y={-half}
          width={scaledSize} height={scaledSize}
          fill={bgColor}
          stroke={borderWidth > 0 ? borderColor : undefined}
          strokeWidth={borderWidth * s}
        />
      )}
      {shape === 'pill' && (
        <Rect
          x={-half} y={-half * 0.6}
          width={scaledSize} height={scaledSize * 0.6}
          fill={bgColor}
          cornerRadius={scaledSize * 0.3}
          stroke={borderWidth > 0 ? borderColor : undefined}
          strokeWidth={borderWidth * s}
        />
      )}
      {shape === 'starburst' && (
        <Star
          x={0} y={0}
          numPoints={12}
          innerRadius={half * 0.7}
          outerRadius={half}
          fill={bgColor}
          stroke={borderWidth > 0 ? borderColor : undefined}
          strokeWidth={borderWidth * s}
        />
      )}
      {text && (
        <Text
          text={text}
          x={-half + 4} y={shape === 'pill' ? -half * 0.3 + 2 : -half + 4}
          width={scaledSize - 8}
          height={shape === 'pill' ? scaledSize * 0.6 - 4 : scaledSize - 8}
          align={textAlign}
          verticalAlign="middle"
          fontSize={scaledFontSize}
          fontFamily={fontFamily}
          fontStyle={fontStyle}
          fill={textColor}
          lineHeight={1.2}
          wrap="word"
        />
      )}
    </Group>
  )
}

export default function BannerCanvas({ format, scale = 1 }) {
  const {
    image, headline, tagline, subtext, ctaText, badge, logo, brandColor,
    headlineFont, headlineColor, headlineSize,
    taglineFont, taglineColor, taglineSize,
    subtextFont, subtextColor, subtextSize,
    ctaFont, ctaColor, ctaSize,
    activeBadgeSrc, focusPoints,
    logoPosition, logoSize, badgePosition, badgeSize, badgeEnabled,
    badgeShape, badgeBgColor, badgeTextColor, badgeBorderColor, badgeBorderWidth,
    badgeFontFamily, badgeFontSize: badgeFontSizeSetting, badgeBold, badgeItalic, badgeTextAlign,
    badgeLine1, badgeLine2, badgeLine3, badgeRotation,
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
  const logoH = Math.round((logoSize || 40) * s)
  const padding = Math.round(40 * s)
  const badgeImgSize = Math.round((badgeSize || 60) * s)
  const textAreaY = height * 0.50

  const headlineEndY = headline ? textAreaY + hSize * 1.2 + 6 : textAreaY
  const taglineEndY = tagline ? headlineEndY + tSize * 1.3 + 4 : headlineEndY
  const subtextStartY = taglineEndY + 4

  const showBadge = badgeEnabled || badgeLine1 || badgeLine2 || badgeLine3

  // Pre-compute badge position
  const scaledBadgeSz = Math.round((badgeSize || 60) * s)
  const badgePos = getCornerPos(badgePosition, width, height, scaledBadgeSz, scaledBadgeSz, padding)

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

        {/* Badge designer — shape with optional text */}
        {showBadge && (
          <BadgeDesigner
            x={badgePos.x} y={badgePos.y}
            size={badgeSize} shape={badgeShape}
            bgColor={badgeBgColor} textColor={badgeTextColor}
            borderColor={badgeBorderColor} borderWidth={badgeBorderWidth}
            fontFamily={badgeFontFamily} fontSize={badgeFontSizeSetting}
            bold={badgeBold} italic={badgeItalic} textAlign={badgeTextAlign}
            line1={badgeLine1} line2={badgeLine2} line3={badgeLine3}
            rotation={badgeRotation} scale={s}
          />
        )}

        {/* Badge image from library — fallback when badge designer is off */}
        {!showBadge && badgeImage && (
          <KonvaImage
            image={badgeImage}
            x={badgePos.x} y={badgePos.y}
            width={badgeImgSize}
            height={badgeImgSize * (badgeImage.height / badgeImage.width)}
          />
        )}

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
