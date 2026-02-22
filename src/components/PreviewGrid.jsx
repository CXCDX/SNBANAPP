import { useRef, useCallback } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group } from 'react-konva'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { AD_FORMATS } from '../utils/formats'
import { getCenterCrop } from '../utils/cropImage'
import { getTextTheme, getOverlayGradient } from '../utils/luminance'
import { useEffect, useState, useMemo } from 'react'

/**
 * A lightweight preview thumbnail that renders a scaled-down Konva stage.
 */
function PreviewThumbnail({ format, onClick }) {
  const { image, headline, subtext, ctaText, badge, logo, brandColor } = useAppState()
  const [bgImage, setBgImage] = useState(null)
  const [logoImage, setLogoImage] = useState(null)

  const { width, height } = format

  // Compute scale to fit ~200px wide thumbnails
  const maxThumbWidth = 200
  const scale = maxThumbWidth / width
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
  const subtextSize = Math.round(20 * baseFontScale)
  const ctaFontSize = Math.round(18 * baseFontScale)
  const badgeSize = Math.round(14 * baseFontScale)
  const logoHeight = Math.round(40 * baseFontScale)
  const padding = Math.round(40 * baseFontScale)
  const textAreaY = height * 0.55

  return (
    <button
      onClick={onClick}
      className="group relative rounded-lg overflow-hidden border border-border hover:border-accent/50
        hover:shadow-[0_0_16px_rgba(0,196,255,0.15)] transition-all duration-200 cursor-pointer bg-transparent p-0"
      aria-label={`Preview ${format.name} — ${format.width}×${format.height}. Click to expand.`}
    >
      <Stage width={displayWidth} height={displayHeight} scaleX={scale} scaleY={scale}>
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
              <Rect width={Math.max(badge.length * badgeSize * 0.65, 60)} height={badgeSize * 2.2} fill={brandColor} cornerRadius={4} />
              <Text text={badge} width={Math.max(badge.length * badgeSize * 0.65, 60)} height={badgeSize * 2.2} align="center" verticalAlign="middle" fontSize={badgeSize} fontFamily="Barlow Condensed" fontStyle="bold" fill="#FFFFFF" />
            </Group>
          )}
          {logoImage && (
            <KonvaImage image={logoImage} x={padding} y={padding} height={logoHeight} width={logoHeight * (logoImage.width / logoImage.height)} />
          )}
          {headline && (
            <Text text={headline.toUpperCase()} x={padding} y={textAreaY} width={width - padding * 2} fontSize={headlineSize} fontFamily="Barlow Condensed" fontStyle="bold" fill={textColor} lineHeight={1.1} wrap="word" />
          )}
          {subtext && (
            <Text text={subtext} x={padding} y={textAreaY + headlineSize * 1.3 + 8} width={width - padding * 2} fontSize={subtextSize} fontFamily="DM Sans" fill={textColor} opacity={0.85} lineHeight={1.4} wrap="word" />
          )}
          {ctaText && (
            <Group x={padding} y={height - padding - ctaFontSize * 2.8}>
              <Rect width={Math.max(ctaText.length * ctaFontSize * 0.65, 100)} height={ctaFontSize * 2.5} fill="#FF6B35" cornerRadius={6} />
              <Text text={ctaText.toUpperCase()} width={Math.max(ctaText.length * ctaFontSize * 0.65, 100)} height={ctaFontSize * 2.5} align="center" verticalAlign="middle" fontSize={ctaFontSize} fontFamily="DM Sans" fontStyle="bold" fill="#FFFFFF" letterSpacing={1} />
            </Group>
          )}
          <Rect x={0} y={height - 4} width={width} height={4} fill={brandColor} />
        </Layer>
      </Stage>
      <div className="absolute bottom-0 left-0 right-0 bg-bg/80 backdrop-blur-sm px-2 py-1">
        <p className="text-[10px] font-mono text-text-secondary truncate">{format.name}</p>
        <p className="text-[9px] font-mono text-text-secondary/60">{format.width}×{format.height}</p>
      </div>
    </button>
  )
}

export default function PreviewGrid() {
  const dispatch = useAppDispatch()

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-heading font-semibold text-text-primary uppercase tracking-wide">
        All Formats
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {AD_FORMATS.map((format) => (
          <PreviewThumbnail
            key={format.id}
            format={format}
            onClick={() => dispatch({ type: 'SET_EXPANDED_FORMAT', payload: format.id })}
          />
        ))}
      </div>
    </div>
  )
}
