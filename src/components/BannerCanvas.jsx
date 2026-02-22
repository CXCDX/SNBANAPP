import { useRef, useEffect, useState, useMemo } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group } from 'react-konva'
import { useAppState } from '../store/AppContext'
import { getCenterCrop } from '../utils/cropImage'
import { getTextTheme, getOverlayGradient } from '../utils/luminance'

export default function BannerCanvas({ format, scale = 1 }) {
  const {
    image, headline, tagline, subtext, ctaText, badge, logo, brandColor,
    headlineFont, headlineColor, taglineFont, taglineColor,
    subtextFont, subtextColor, ctaFont, ctaColor,
    activeBadgeSrc,
  } = useAppState()
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
    return getCenterCrop(bgImage.width, bgImage.height, width, height)
  }, [bgImage, width, height])

  const s = Math.min(width, height) / 1080
  const headlineSize = Math.round(48 * s)
  const taglineSize = Math.round(28 * s)
  const subtextSize = Math.round(20 * s)
  const ctaFontSize = Math.round(18 * s)
  const badgeFontSize = Math.round(14 * s)
  const logoHeight = Math.round(40 * s)
  const padding = Math.round(40 * s)
  const badgeImgSize = Math.round(60 * s)
  const textAreaY = height * 0.50

  const headlineEndY = headline ? textAreaY + headlineSize * 1.2 + 6 : textAreaY
  const taglineEndY = tagline ? headlineEndY + taglineSize * 1.3 + 4 : headlineEndY
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

        {/* Badge image from library */}
        {badgeImage && (
          <KonvaImage
            image={badgeImage}
            x={width - padding - badgeImgSize}
            y={padding}
            width={badgeImgSize}
            height={badgeImgSize * (badgeImage.height / badgeImage.width)}
          />
        )}

        {/* Badge text fallback */}
        {badge && !badgeImage && (
          <Group x={width - padding - Math.max(badge.length * badgeFontSize * 0.65, 60)} y={padding}>
            <Rect
              width={Math.max(badge.length * badgeFontSize * 0.65, 60)}
              height={badgeFontSize * 2.2}
              fill={brandColor}
            />
            <Text
              text={badge}
              width={Math.max(badge.length * badgeFontSize * 0.65, 60)}
              height={badgeFontSize * 2.2}
              align="center" verticalAlign="middle"
              fontSize={badgeFontSize}
              fontFamily={headlineFont}
              fontStyle="bold"
              fill="#FFFFFF"
            />
          </Group>
        )}

        {logoImage && (
          <KonvaImage
            image={logoImage}
            x={padding} y={padding}
            height={logoHeight}
            width={logoHeight * (logoImage.width / logoImage.height)}
          />
        )}

        {headline && (
          <Text
            text={headline.toUpperCase()}
            x={padding} y={textAreaY} width={width - padding * 2}
            fontSize={headlineSize}
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
            fontSize={taglineSize}
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
            fontSize={subtextSize}
            fontFamily={subtextFont}
            fill={subtextColor || autoTextColor}
            opacity={subtextColor ? 1 : 0.8}
            lineHeight={1.6} wrap="word"
          />
        )}

        {ctaText && (
          <Group x={padding} y={height - padding - ctaFontSize * 2.8}>
            <Rect
              width={Math.max(ctaText.length * ctaFontSize * 0.65, 100)}
              height={ctaFontSize * 2.5}
              fill={ctaColor || '#0A0A0A'}
            />
            <Text
              text={ctaText.toUpperCase()}
              width={Math.max(ctaText.length * ctaFontSize * 0.65, 100)}
              height={ctaFontSize * 2.5}
              align="center" verticalAlign="middle"
              fontSize={ctaFontSize}
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
