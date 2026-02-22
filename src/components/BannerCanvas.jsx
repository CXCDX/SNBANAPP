import { useRef, useEffect, useState, useMemo } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group } from 'react-konva'
import { useAppState } from '../store/AppContext'
import { getCenterCrop } from '../utils/cropImage'
import { getTextTheme, getOverlayGradient } from '../utils/luminance'

export default function BannerCanvas({ format, scale = 1 }) {
  const { image, headline, tagline, subtext, ctaText, badge, logo, brandColor } = useAppState()
  const stageRef = useRef(null)
  const [bgImage, setBgImage] = useState(null)
  const [logoImage, setLogoImage] = useState(null)

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

  const textTheme = useMemo(() => {
    if (!image) return 'light'
    return getTextTheme(image.luminance)
  }, [image])

  const textColor = textTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
  const overlayGradient = useMemo(() => getOverlayGradient(textTheme), [textTheme])

  const crop = useMemo(() => {
    if (!bgImage) return null
    return getCenterCrop(bgImage.width, bgImage.height, width, height)
  }, [bgImage, width, height])

  const baseFontScale = Math.min(width, height) / 1080
  const headlineSize = Math.round(48 * baseFontScale)
  const taglineSize = Math.round(28 * baseFontScale)
  const subtextSize = Math.round(20 * baseFontScale)
  const ctaFontSize = Math.round(18 * baseFontScale)
  const badgeSize = Math.round(14 * baseFontScale)
  const logoHeight = Math.round(40 * baseFontScale)
  const padding = Math.round(40 * baseFontScale)
  const textAreaY = height * 0.50

  // Compute Y offsets for stacked text
  let yOffset = textAreaY
  const headlineEndY = headline ? yOffset + headlineSize * 1.2 + 6 : yOffset
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
            x={0} y={0}
            width={width} height={height}
            crop={{ x: crop.sx, y: crop.sy, width: crop.sWidth, height: crop.sHeight }}
          />
        )}

        {bgImage && (
          <Rect
            x={0} y={height * 0.3}
            width={width} height={height * 0.7}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: height * 0.7 }}
            fillLinearGradientColorStops={[0, overlayGradient.to, 1, overlayGradient.from]}
          />
        )}

        {badge && (
          <Group x={width - padding - Math.max(badge.length * badgeSize * 0.65, 60)} y={padding}>
            <Rect
              width={Math.max(badge.length * badgeSize * 0.65, 60)}
              height={badgeSize * 2.2}
              fill={brandColor}
            />
            <Text
              text={badge}
              width={Math.max(badge.length * badgeSize * 0.65, 60)}
              height={badgeSize * 2.2}
              align="center"
              verticalAlign="middle"
              fontSize={badgeSize}
              fontFamily="Playfair Display"
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
            x={padding} y={textAreaY}
            width={width - padding * 2}
            fontSize={headlineSize}
            fontFamily="Playfair Display"
            fontStyle="bold"
            fill={textColor}
            lineHeight={1.1}
            letterSpacing={2}
            wrap="word"
          />
        )}

        {tagline && (
          <Text
            text={tagline}
            x={padding} y={headlineEndY}
            width={width - padding * 2}
            fontSize={taglineSize}
            fontFamily="Playfair Display"
            fontStyle="italic"
            fill={textColor}
            opacity={0.9}
            lineHeight={1.3}
            wrap="word"
          />
        )}

        {subtext && (
          <Text
            text={subtext}
            x={padding} y={subtextStartY}
            width={width - padding * 2}
            fontSize={subtextSize}
            fontFamily="DM Mono"
            fill={textColor}
            opacity={0.8}
            lineHeight={1.6}
            wrap="word"
          />
        )}

        {ctaText && (
          <Group x={padding} y={height - padding - ctaFontSize * 2.8}>
            <Rect
              width={Math.max(ctaText.length * ctaFontSize * 0.65, 100)}
              height={ctaFontSize * 2.5}
              fill="#0A0A0A"
            />
            <Text
              text={ctaText.toUpperCase()}
              width={Math.max(ctaText.length * ctaFontSize * 0.65, 100)}
              height={ctaFontSize * 2.5}
              align="center"
              verticalAlign="middle"
              fontSize={ctaFontSize}
              fontFamily="DM Mono"
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
