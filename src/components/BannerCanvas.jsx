import { useRef, useEffect, useState, useMemo } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group } from 'react-konva'
import { useAppState } from '../store/AppContext'
import { getCenterCrop } from '../utils/cropImage'
import { getTextTheme, getOverlayGradient } from '../utils/luminance'

/**
 * Render a single banner format on a Konva stage.
 * Used both for preview and for export.
 */
export default function BannerCanvas({ format, scale = 1, interactive = false }) {
  const { image, headline, subtext, ctaText, badge, logo, brandColor } = useAppState()
  const stageRef = useRef(null)
  const [bgImage, setBgImage] = useState(null)
  const [logoImage, setLogoImage] = useState(null)

  const { width, height } = format
  const displayWidth = width * scale
  const displayHeight = height * scale

  // Load background image
  useEffect(() => {
    if (!image) { setBgImage(null); return }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setBgImage(img)
    img.src = image.src
  }, [image])

  // Load logo
  useEffect(() => {
    if (!logo) { setLogoImage(null); return }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setLogoImage(img)
    img.src = logo
  }, [logo])

  // Compute text theme based on luminance
  const textTheme = useMemo(() => {
    if (!image) return 'light'
    return getTextTheme(image.luminance)
  }, [image])

  const textColor = textTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
  const overlayGradient = useMemo(() => getOverlayGradient(textTheme), [textTheme])

  // Smart crop
  const crop = useMemo(() => {
    if (!bgImage) return null
    return getCenterCrop(bgImage.width, bgImage.height, width, height)
  }, [bgImage, width, height])

  // Responsive font sizes based on format
  const baseFontScale = Math.min(width, height) / 1080
  const headlineSize = Math.round(48 * baseFontScale)
  const subtextSize = Math.round(20 * baseFontScale)
  const ctaFontSize = Math.round(18 * baseFontScale)
  const badgeSize = Math.round(14 * baseFontScale)
  const logoHeight = Math.round(40 * baseFontScale)
  const padding = Math.round(40 * baseFontScale)

  // Layout: text area at the bottom
  const textAreaY = height * 0.55

  return (
    <Stage
      ref={stageRef}
      width={displayWidth}
      height={displayHeight}
      scaleX={scale}
      scaleY={scale}
      style={{ background: '#0A0A0A' }}
      aria-label={`Banner preview for ${format.name}`}
    >
      <Layer>
        {/* Background */}
        <Rect width={width} height={height} fill="#1E1E1E" />

        {/* Background image with smart crop */}
        {bgImage && crop && (
          <KonvaImage
            image={bgImage}
            x={0}
            y={0}
            width={width}
            height={height}
            crop={{ x: crop.sx, y: crop.sy, width: crop.sWidth, height: crop.sHeight }}
          />
        )}

        {/* Gradient overlay for text readability */}
        {bgImage && (
          <Rect
            x={0}
            y={height * 0.3}
            width={width}
            height={height * 0.7}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: height * 0.7 }}
            fillLinearGradientColorStops={[0, overlayGradient.to, 1, overlayGradient.from]}
          />
        )}

        {/* Badge */}
        {badge && (
          <Group x={width - padding - Math.max(badge.length * badgeSize * 0.65, 60)} y={padding}>
            <Rect
              width={Math.max(badge.length * badgeSize * 0.65, 60)}
              height={badgeSize * 2.2}
              fill={brandColor}
              cornerRadius={4}
            />
            <Text
              text={badge}
              width={Math.max(badge.length * badgeSize * 0.65, 60)}
              height={badgeSize * 2.2}
              align="center"
              verticalAlign="middle"
              fontSize={badgeSize}
              fontFamily="Barlow Condensed"
              fontStyle="bold"
              fill="#FFFFFF"
            />
          </Group>
        )}

        {/* Logo */}
        {logoImage && (
          <KonvaImage
            image={logoImage}
            x={padding}
            y={padding}
            height={logoHeight}
            width={logoHeight * (logoImage.width / logoImage.height)}
          />
        )}

        {/* Headline */}
        {headline && (
          <Text
            text={headline.toUpperCase()}
            x={padding}
            y={textAreaY}
            width={width - padding * 2}
            fontSize={headlineSize}
            fontFamily="Barlow Condensed"
            fontStyle="bold"
            fill={textColor}
            lineHeight={1.1}
            wrap="word"
          />
        )}

        {/* Subtext */}
        {subtext && (
          <Text
            text={subtext}
            x={padding}
            y={textAreaY + headlineSize * 1.3 + 8}
            width={width - padding * 2}
            fontSize={subtextSize}
            fontFamily="DM Sans"
            fill={textColor}
            opacity={0.85}
            lineHeight={1.4}
            wrap="word"
          />
        )}

        {/* CTA Button */}
        {ctaText && (
          <Group x={padding} y={height - padding - ctaFontSize * 2.8}>
            <Rect
              width={Math.max(ctaText.length * ctaFontSize * 0.65, 100)}
              height={ctaFontSize * 2.5}
              fill="#FF6B35"
              cornerRadius={6}
            />
            <Text
              text={ctaText.toUpperCase()}
              width={Math.max(ctaText.length * ctaFontSize * 0.65, 100)}
              height={ctaFontSize * 2.5}
              align="center"
              verticalAlign="middle"
              fontSize={ctaFontSize}
              fontFamily="DM Sans"
              fontStyle="bold"
              fill="#FFFFFF"
              letterSpacing={1}
            />
          </Group>
        )}

        {/* Brand color accent strip at bottom */}
        <Rect
          x={0}
          y={height - 4}
          width={width}
          height={4}
          fill={brandColor}
        />
      </Layer>
    </Stage>
  )
}

/**
 * Get Konva stage ref for export — exposed as a separate utility.
 */
export function getStageRef(ref) {
  return ref?.current?.getStage()
}
