import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group, Circle, Star } from 'react-konva'
import { useAppState, useAppDispatch } from '../store/AppContext'
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

const FIELD_MAP = {
  headline: { action: 'SET_HEADLINE', label: 'Headline' },
  tagline: { action: 'SET_TAGLINE', label: 'Tagline' },
  subtext: { action: 'SET_SUBTEXT', label: 'Subtext' },
  cta: { action: 'SET_CTA', label: 'CTA' },
}

function SelectionHandles({ x, y, w, h }) {
  const sz = 6
  const corners = [
    { cx: x, cy: y },
    { cx: x + w, cy: y },
    { cx: x, cy: y + h },
    { cx: x + w, cy: y + h },
  ]
  return (
    <>
      <Rect x={x} y={y} width={w} height={h} stroke="#00C4FF" strokeWidth={1.5} dash={[4, 3]} listening={false} />
      {corners.map((c, i) => (
        <Rect key={i} x={c.cx - sz / 2} y={c.cy - sz / 2} width={sz} height={sz} fill="#00C4FF" listening={false} />
      ))}
    </>
  )
}

export default function EditModeBannerCanvas({ format, scale = 1 }) {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const {
    image, headline, tagline, subtext, ctaText, badge, logo, brandColor,
    headlineFont, headlineColor, headlineSize,
    taglineFont, taglineColor, taglineSize,
    subtextFont, subtextColor, subtextSize,
    ctaFont, ctaColor, ctaSize,
    activeBadgeSrc, focusPoints, textPositions, extraTextLayers,
    logoPosition, logoSize, badgePosition, badgeSize, badgeEnabled,
    badgeShape, badgeBgColor, badgeTextColor, badgeBorderColor, badgeBorderWidth,
    badgeFontFamily, badgeFontSize: badgeFontSizeSetting, badgeBold, badgeItalic, badgeTextAlign,
    badgeLine1, badgeLine2, badgeLine3, badgeRotation,
  } = state

  const stageRef = useRef(null)
  const [bgImage, setBgImage] = useState(null)
  const [logoImage, setLogoImage] = useState(null)
  const [badgeImage, setBadgeImage] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [editingText, setEditingText] = useState(null)
  const editInputRef = useRef(null)

  const { width, height } = format
  const displayWidth = width * scale
  const displayHeight = height * scale
  const formatKey = `${width}x${height}`
  const focusPoint = focusPoints[formatKey] || { x: 0.5, y: 0.5 }

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

  const textTheme = useMemo(() => image ? getTextTheme(image.luminance) : 'light', [image])
  const autoTextColor = textTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
  const overlayGradient = useMemo(() => getOverlayGradient(textTheme), [textTheme])

  const crop = useMemo(() => {
    if (!bgImage) return null
    return getCenterCrop(bgImage.width, bgImage.height, width, height, focusPoint)
  }, [bgImage, width, height, focusPoint])

  const s = Math.min(width, height) / 1080
  const fontSc = width / 1080
  const hSize = Math.max(10, Math.round((headlineSize || 48) * fontSc))
  const tSize = Math.max(10, Math.round((taglineSize || 28) * fontSc))
  const sSize = Math.max(10, Math.round((subtextSize || 20) * fontSc))
  const cSize = Math.max(10, Math.round((ctaSize || 18) * fontSc))
  const logoH = Math.round((logoSize || 40) * s)
  const pad = Math.round(40 * s)
  const badgeImgSz = Math.round((badgeSize || 60) * s)
  const textAreaY = height * 0.50

  const headlineEndY = headline ? textAreaY + hSize * 1.2 + 6 : textAreaY
  const taglineEndY = tagline ? headlineEndY + tSize * 1.3 + 4 : headlineEndY

  const showBadge = badgeEnabled || badgeLine1 || badgeLine2 || badgeLine3

  const getPos = (field, defaultX, defaultY) => {
    if (textPositions[field]) {
      return {
        x: textPositions[field].x * width,
        y: textPositions[field].y * height,
      }
    }
    return { x: defaultX, y: defaultY }
  }

  const handleDragEnd = (field) => (e) => {
    dispatch({
      type: 'SET_TEXT_POSITION',
      payload: { field, position: { x: e.target.x() / width, y: e.target.y() / height } },
    })
  }

  const handleTextDblClick = (field, currentValue) => {
    setEditingText({ field, value: currentValue })
  }

  const handleTextEditDone = useCallback(() => {
    if (!editingText) return
    const fm = FIELD_MAP[editingText.field]
    if (fm) dispatch({ type: fm.action, payload: editingText.value })
    setEditingText(null)
  }, [editingText, dispatch])

  // Focus input when editing text
  useEffect(() => {
    if (editingText && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingText])

  // Keyboard: Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (editingText) handleTextEditDone()
        else setSelectedId(null)
      }
      if (e.key === 'Enter' && editingText) {
        handleTextEditDone()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editingText, handleTextEditDone])

  // Selection rect for handles
  const getSelectionRect = () => {
    if (!selectedId) return null
    switch (selectedId) {
      case 'headline': {
        const pos = getPos('headline', pad, textAreaY)
        return { x: pos.x - 4, y: pos.y - 4, w: width - pad * 2 + 8, h: hSize * 1.2 + 8 }
      }
      case 'tagline': {
        const pos = getPos('tagline', pad, headlineEndY)
        return { x: pos.x - 4, y: pos.y - 4, w: width - pad * 2 + 8, h: tSize * 1.3 + 8 }
      }
      case 'subtext': {
        const pos = getPos('subtext', pad, taglineEndY + 4)
        return { x: pos.x - 4, y: pos.y - 4, w: width - pad * 2 + 8, h: sSize * 1.6 + 8 }
      }
      case 'cta': {
        const pos = getPos('cta', pad, height - pad - cSize * 2.8)
        const ctaW = Math.max((ctaText?.length || 5) * cSize * 0.65, 100)
        return { x: pos.x - 4, y: pos.y - 4, w: ctaW + 8, h: cSize * 2.5 + 8 }
      }
      default: return null
    }
  }

  const selRect = getSelectionRect()

  return (
    <div style={{ position: 'relative' }}>
      <Stage
        ref={stageRef}
        width={displayWidth}
        height={displayHeight}
        scaleX={scale}
        scaleY={scale}
        onClick={(e) => {
          if (e.target === e.target.getStage() || e.target.name() === 'bg') {
            setSelectedId(null)
            // Update focus point on background click
            if (image) {
              const stage = stageRef.current
              if (stage) {
                const pointer = stage.getPointerPosition()
                if (pointer) {
                  const fx = Math.max(0, Math.min(1, pointer.x / scale / width))
                  const fy = Math.max(0, Math.min(1, pointer.y / scale / height))
                  dispatch({ type: 'SET_FORMAT_FOCUS_POINT', payload: { formatKey, point: { x: fx, y: fy } } })
                }
              }
            }
          }
        }}
      >
        <Layer>
          <Rect name="bg" width={width} height={height} fill="#1E1E1E" />

          {bgImage && crop && (
            <KonvaImage
              name="bg"
              image={bgImage}
              x={0} y={0} width={width} height={height}
              crop={{ x: crop.sx, y: crop.sy, width: crop.sWidth, height: crop.sHeight }}
            />
          )}

          {bgImage && (
            <Rect
              name="bg"
              x={0} y={height * 0.3} width={width} height={height * 0.7}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{ x: 0, y: height * 0.7 }}
              fillLinearGradientColorStops={[0, overlayGradient.to, 1, overlayGradient.from]}
            />
          )}

          {/* Focus point crosshair */}
          {image && (
            <Group x={focusPoint.x * width} y={focusPoint.y * height} listening={false}>
              <Rect x={-1} y={-16} width={2} height={32} fill="rgba(0,196,255,0.7)" />
              <Rect x={-16} y={-1} width={32} height={2} fill="rgba(0,196,255,0.7)" />
              <Circle x={0} y={0} radius={4} stroke="rgba(0,196,255,0.9)" strokeWidth={1.5} fill="transparent" />
            </Group>
          )}

          {/* Badge designer — shape-based badge (priority) */}
          {showBadge && (() => {
            const scaledSize = Math.round(badgeSize * s)
            const bp = getCornerPos(badgePosition, width, height, scaledSize, scaledSize, pad)
            const half = scaledSize / 2
            const scaledFontSize = Math.max(10, Math.round(badgeFontSizeSetting * fontSc))
            const lines = [badgeLine1, badgeLine2, badgeLine3].filter(Boolean)
            const text = lines.join('\n')
            const fontStyle = `${badgeBold ? 'bold' : ''} ${badgeItalic ? 'italic' : ''}`.trim() || 'normal'
            return (
              <Group x={bp.x + half} y={bp.y + half} rotation={badgeRotation} onClick={(e) => { e.cancelBubble = true; setSelectedId('badge') }}>
                {badgeShape === 'circle' && (
                  <Circle radius={half} fill={badgeBgColor} stroke={badgeBorderWidth > 0 ? badgeBorderColor : undefined} strokeWidth={badgeBorderWidth * s} />
                )}
                {badgeShape === 'rectangle' && (
                  <Rect x={-half} y={-half} width={scaledSize} height={scaledSize} fill={badgeBgColor} stroke={badgeBorderWidth > 0 ? badgeBorderColor : undefined} strokeWidth={badgeBorderWidth * s} />
                )}
                {badgeShape === 'pill' && (
                  <Rect x={-half} y={-half * 0.6} width={scaledSize} height={scaledSize * 0.6} fill={badgeBgColor} cornerRadius={scaledSize * 0.3} stroke={badgeBorderWidth > 0 ? badgeBorderColor : undefined} strokeWidth={badgeBorderWidth * s} />
                )}
                {badgeShape === 'starburst' && (
                  <Star numPoints={12} innerRadius={half * 0.7} outerRadius={half} fill={badgeBgColor} stroke={badgeBorderWidth > 0 ? badgeBorderColor : undefined} strokeWidth={badgeBorderWidth * s} />
                )}
                {text && (
                  <Text
                    text={text}
                    x={-half + 4} y={badgeShape === 'pill' ? -half * 0.3 + 2 : -half + 4}
                    width={scaledSize - 8}
                    height={badgeShape === 'pill' ? scaledSize * 0.6 - 4 : scaledSize - 8}
                    align={badgeTextAlign} verticalAlign="middle"
                    fontSize={scaledFontSize} fontFamily={badgeFontFamily} fontStyle={fontStyle}
                    fill={badgeTextColor} lineHeight={1.2} wrap="word"
                  />
                )}
              </Group>
            )
          })()}

          {/* Badge image — fallback */}
          {!showBadge && badgeImage && (() => {
            const bh = badgeImgSz * (badgeImage.height / badgeImage.width)
            const bp = getCornerPos(badgePosition, width, height, badgeImgSz, bh, pad)
            return <KonvaImage image={badgeImage} x={bp.x} y={bp.y} width={badgeImgSz} height={bh} onClick={(e) => { e.cancelBubble = true; setSelectedId('badge') }} />
          })()}

          {/* Old badge text fallback */}
          {!showBadge && !badgeImage && badge && (() => {
            const bfz = Math.round(14 * s)
            const bw = Math.max(badge.length * bfz * 0.65, 60)
            const bh = bfz * 2.2
            const bp = getCornerPos(badgePosition, width, height, bw, bh, pad)
            return (
              <Group x={bp.x} y={bp.y} onClick={(e) => { e.cancelBubble = true; setSelectedId('badge') }}>
                <Rect width={bw} height={bh} fill={brandColor} />
                <Text text={badge} width={bw} height={bh} align="center" verticalAlign="middle" fontSize={bfz} fontFamily={headlineFont} fontStyle="bold" fill="#FFFFFF" />
              </Group>
            )
          })()}

          {/* Logo */}
          {logoImage && (() => {
            const lw = logoH * (logoImage.width / logoImage.height)
            const lp = getCornerPos(logoPosition, width, height, lw, logoH, pad)
            return <KonvaImage image={logoImage} x={lp.x} y={lp.y} height={logoH} width={lw} />
          })()}

          {/* Draggable text elements */}
          {headline && (() => {
            const pos = getPos('headline', pad, textAreaY)
            return (
              <Text
                text={headline.toUpperCase()}
                x={pos.x} y={pos.y} width={width - pad * 2}
                fontSize={hSize} fontFamily={headlineFont} fontStyle="bold"
                fill={headlineColor || autoTextColor}
                lineHeight={1.1} letterSpacing={2} wrap="word"
                draggable
                onDragEnd={handleDragEnd('headline')}
                onDblClick={() => handleTextDblClick('headline', headline)}
                onClick={() => setSelectedId('headline')}
              />
            )
          })()}

          {tagline && (() => {
            const pos = getPos('tagline', pad, headlineEndY)
            return (
              <Text
                text={tagline}
                x={pos.x} y={pos.y} width={width - pad * 2}
                fontSize={tSize} fontFamily={taglineFont} fontStyle="italic"
                fill={taglineColor || autoTextColor}
                opacity={taglineColor ? 1 : 0.9}
                lineHeight={1.3} wrap="word"
                draggable
                onDragEnd={handleDragEnd('tagline')}
                onDblClick={() => handleTextDblClick('tagline', tagline)}
                onClick={() => setSelectedId('tagline')}
              />
            )
          })()}

          {subtext && (() => {
            const pos = getPos('subtext', pad, taglineEndY + 4)
            return (
              <Text
                text={subtext}
                x={pos.x} y={pos.y} width={width - pad * 2}
                fontSize={sSize} fontFamily={subtextFont}
                fill={subtextColor || autoTextColor}
                opacity={subtextColor ? 1 : 0.8}
                lineHeight={1.6} wrap="word"
                draggable
                onDragEnd={handleDragEnd('subtext')}
                onDblClick={() => handleTextDblClick('subtext', subtext)}
                onClick={() => setSelectedId('subtext')}
              />
            )
          })()}

          {ctaText && (() => {
            const pos = getPos('cta', pad, height - pad - cSize * 2.8)
            const ctaW = Math.max(ctaText.length * cSize * 0.65, 100)
            return (
              <Group
                x={pos.x} y={pos.y}
                draggable
                onDragEnd={handleDragEnd('cta')}
                onDblClick={() => handleTextDblClick('cta', ctaText)}
                onClick={() => setSelectedId('cta')}
              >
                <Rect width={ctaW} height={cSize * 2.5} fill={ctaColor || '#0A0A0A'} />
                <Text
                  text={ctaText.toUpperCase()}
                  width={ctaW} height={cSize * 2.5}
                  align="center" verticalAlign="middle"
                  fontSize={cSize} fontFamily={ctaFont} fontStyle="500"
                  fill="#FFFFFF" letterSpacing={1}
                />
              </Group>
            )
          })()}

          {/* Extra text layers */}
          {(extraTextLayers || []).map(layer => {
            if (!layer.content) return null
            const layerSize = Math.max(10, Math.round((layer.size || 24) * fontSc))
            const pos = getPos(layer.id, pad, textAreaY + 60 * s)
            const isHeadline = layer.type === 'headline'
            const isTagline = layer.type === 'tagline'
            return (
              <Text
                key={layer.id}
                text={isHeadline ? layer.content.toUpperCase() : layer.content}
                x={pos.x} y={pos.y} width={width - pad * 2}
                fontSize={layerSize}
                fontFamily={layer.font}
                fontStyle={isHeadline ? 'bold' : isTagline ? 'italic' : 'normal'}
                fill={layer.color || autoTextColor}
                opacity={layer.color ? 1 : (isTagline ? 0.9 : isHeadline ? 1 : 0.8)}
                lineHeight={isHeadline ? 1.1 : isTagline ? 1.3 : 1.6}
                letterSpacing={isHeadline ? 2 : 0}
                wrap="word"
                draggable
                onDragEnd={handleDragEnd(layer.id)}
                onClick={() => setSelectedId(layer.id)}
              />
            )
          })}

          <Rect x={0} y={height - 3} width={width} height={3} fill={brandColor} />

          {/* Selection handles */}
          {selRect && (
            <SelectionHandles x={selRect.x} y={selRect.y} w={selRect.w} h={selRect.h} />
          )}

          {/* Badge resize handles */}
          {selectedId === 'badge' && (() => {
            const hasBadge = showBadge || badgeImage || (badge && !badgeImage)
            if (!hasBadge) return null

            let bx, by, bw, bh
            if (showBadge) {
              const sz = Math.round((badgeSize || 60) * s)
              const bp = getCornerPos(badgePosition, width, height, sz, sz, pad)
              bx = bp.x; by = bp.y; bw = sz; bh = sz
            } else if (badgeImage) {
              const bh2 = badgeImgSz * (badgeImage.height / badgeImage.width)
              const bp = getCornerPos(badgePosition, width, height, badgeImgSz, bh2, pad)
              bx = bp.x; by = bp.y; bw = badgeImgSz; bh = bh2
            } else {
              const bfz = Math.round(14 * s)
              const bw2 = Math.max(badge.length * bfz * 0.65, 60)
              const bh2 = bfz * 2.2
              const bp = getCornerPos(badgePosition, width, height, bw2, bh2, pad)
              bx = bp.x; by = bp.y; bw = bw2; bh = bh2
            }

            const hsz = 8
            const centerX = bx + bw / 2
            const centerY = by + bh / 2
            const corners = [
              { cx: bx, cy: by },
              { cx: bx + bw, cy: by },
              { cx: bx, cy: by + bh },
              { cx: bx + bw, cy: by + bh },
            ]

            const handleResize = (e) => {
              const node = e.target
              const nx = node.x() + hsz / 2
              const ny = node.y() + hsz / 2
              const dist = Math.max(Math.abs(nx - centerX), Math.abs(ny - centerY))
              const newScaled = dist * 2
              const newBase = Math.round(newScaled / s)
              const clamped = Math.max(40, Math.min(300, newBase))
              dispatch({ type: 'SET_BADGE_SIZE', payload: clamped })
            }

            return (
              <>
                <Rect x={bx - 4} y={by - 4} width={bw + 8} height={bh + 8}
                  stroke="#00C4FF" strokeWidth={1.5} dash={[4, 3]} listening={false} />
                {corners.map((c, i) => (
                  <Rect
                    key={`badge-handle-${i}`}
                    x={c.cx - hsz / 2} y={c.cy - hsz / 2}
                    width={hsz} height={hsz}
                    fill="#00C4FF"
                    draggable
                    onDragEnd={handleResize}
                    onClick={(e) => { e.cancelBubble = true }}
                  />
                ))}
              </>
            )
          })()}
        </Layer>
      </Stage>

      {/* Inline text editing overlay (contenteditable positioned over canvas) */}
      {editingText && (() => {
        const fieldRect = getSelectionRect()
        if (!fieldRect) {
          // Compute from selectedId mapping manually
          return null
        }
        return (
          <div
            style={{
              position: 'absolute',
              left: `${(fieldRect.x + 4) * scale}px`,
              top: `${(fieldRect.y + 4) * scale}px`,
              width: `${(fieldRect.w - 8) * scale}px`,
              minHeight: `${(fieldRect.h - 8) * scale}px`,
              zIndex: 20,
            }}
          >
            <textarea
              ref={editInputRef}
              value={editingText.value}
              onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
              onBlur={handleTextEditDone}
              className="w-full bg-transparent text-ink resize-none outline-none"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: `${14 * scale}px`,
                color: '#0A0A0A',
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid #00C4FF',
                padding: '4px',
                minHeight: `${(fieldRect.h - 8) * scale}px`,
              }}
            />
          </div>
        )
      })()}
    </div>
  )
}
