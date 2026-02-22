import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group } from 'react-konva'
import { useAppState, useAppDispatch, DEFAULT_FONTS } from '../store/AppContext'
import { AD_FORMATS } from '../utils/formats'
import { getCenterCrop } from '../utils/cropImage'
import { getTextTheme, getOverlayGradient } from '../utils/luminance'

const FIELD_MAP = {
  headline: { action: 'SET_HEADLINE', label: 'Headline', fontKey: 'headline' },
  tagline: { action: 'SET_TAGLINE', label: 'Tagline', fontKey: 'tagline' },
  subtext: { action: 'SET_SUBTEXT', label: 'Subtext', fontKey: 'subtext' },
  cta: { action: 'SET_CTA', label: 'CTA', fontKey: 'cta' },
}

export default function InlineEditor() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const {
    editingFormat, image, headline, tagline, subtext, ctaText, badge,
    logo, brandColor, focusPoints, activeBadgeSrc, textPositions,
    headlineFont, headlineColor, headlineSize,
    taglineFont, taglineColor, taglineSize,
    subtextFont, subtextColor, subtextSize,
    ctaFont, ctaColor, ctaSize,
    logoPosition, logoSize, badgePosition, customFonts,
  } = state

  const stageRef = useRef(null)
  const [bgImage, setBgImage] = useState(null)
  const [logoImage, setLogoImage] = useState(null)
  const [badgeImage, setBadgeImage] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [editingText, setEditingText] = useState(null)
  const [savedState, setSavedState] = useState(null)
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 })
  const containerRef = useRef(null)

  const allFonts = useMemo(() => {
    const custom = customFonts?.map(f => f.name) || []
    return [...DEFAULT_FONTS, ...custom]
  }, [customFonts])

  const format = useMemo(() => {
    if (!editingFormat) return null
    return AD_FORMATS.find(f => f.id === editingFormat) || null
  }, [editingFormat])

  // Save state snapshot on enter
  useEffect(() => {
    if (editingFormat) {
      const { history, historyIndex, toasts, isExporting, exportProgress, exportCancelled, showDesignPolice, designIssues, showExportModal, ...snap } = state
      setSavedState(snap)
    }
  }, [editingFormat !== null])

  // Container sizing
  useEffect(() => {
    if (!containerRef.current) return
    const measure = () => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) setContainerSize({ w: rect.width, h: rect.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [editingFormat])

  // Load images
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

  // Keyboard shortcuts
  useEffect(() => {
    if (!editingFormat) return
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (editingText) {
          handleTextEditDone()
        } else {
          setSelectedId(null)
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        dispatch({ type: e.shiftKey ? 'REDO' : 'UNDO' })
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && !editingText && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault()
          const actionMap = { headline: 'SET_HEADLINE', tagline: 'SET_TAGLINE', subtext: 'SET_SUBTEXT', cta: 'SET_CTA' }
          if (actionMap[selectedId]) {
            dispatch({ type: actionMap[selectedId], payload: '' })
            setSelectedId(null)
          }
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editingFormat, selectedId, editingText, dispatch])

  const handleSave = useCallback(() => {
    dispatch({ type: 'SET_EDITING_FORMAT', payload: null })
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Changes saved', variant: 'success' } })
  }, [dispatch])

  const handleCancel = useCallback(() => {
    if (savedState) {
      dispatch({ type: 'RESTORE_STATE', payload: savedState })
    }
    dispatch({ type: 'SET_EDITING_FORMAT', payload: null })
  }, [savedState, dispatch])

  const handleTextEditDone = useCallback(() => {
    if (!editingText) return
    const { field, value } = editingText
    const fm = FIELD_MAP[field]
    if (fm) {
      dispatch({ type: fm.action, payload: value })
    }
    setEditingText(null)
  }, [editingText, dispatch])

  if (!format) return null

  const { width, height } = format
  const formatKey = `${width}x${height}`
  const focusPoint = focusPoints[formatKey] || { x: 0.5, y: 0.5 }

  // Scale to fill canvas area (leaving room for property panel)
  const panelWidth = 280
  const topBarHeight = 48
  const padding = 40
  const availW = containerSize.w - padding * 2
  const availH = containerSize.h - padding * 2
  const scaleW = availW / width
  const scaleH = availH / height
  const scale = Math.min(scaleW, scaleH, 1)

  const s = Math.min(width, height) / 1080
  const hSize = Math.round((headlineSize || 48) * s)
  const tSize = Math.round((taglineSize || 28) * s)
  const sSize = Math.round((subtextSize || 20) * s)
  const cSize = Math.round((ctaSize || 18) * s)
  const pad = Math.round(40 * s)
  const badgeImgSz = Math.round((state.badgeSize || 60) * s)
  const badgeFontSize = Math.round(14 * s)
  const logoH = Math.round((logoSize || 40) * s)
  const textAreaY = height * 0.50

  const textTheme = image ? getTextTheme(image.luminance) : 'light'
  const autoTextColor = textTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
  const overlayGradient = getOverlayGradient(textTheme)

  const crop = bgImage ? getCenterCrop(bgImage.width, bgImage.height, width, height, focusPoint) : null

  const headlineEndY = headline ? textAreaY + hSize * 1.2 + 6 : textAreaY
  const taglineEndY = tagline ? headlineEndY + tSize * 1.3 + 4 : headlineEndY

  const getPos = (field, defaultX, defaultY) => {
    if (textPositions[field]) return textPositions[field]
    return { x: defaultX, y: defaultY }
  }

  const handleDragEnd = (field) => (e) => {
    dispatch({
      type: 'SET_TEXT_POSITION',
      payload: { field, position: { x: e.target.x(), y: e.target.y() } },
    })
  }

  const handleTextDblClick = (field, currentValue) => {
    setEditingText({ field, value: currentValue })
  }

  const handleBgClick = (e) => {
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const x = pointer.x / scale / width
    const y = pointer.y / scale / height
    dispatch({ type: 'SET_FORMAT_FOCUS_POINT', payload: { formatKey, point: { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) } } })
  }

  const cornerPos = (pos, w, h) => {
    switch (pos) {
      case 'top-left': return { x: pad, y: pad }
      case 'top-right': return { x: width - pad - w, y: pad }
      case 'bottom-left': return { x: pad, y: height - pad - h }
      case 'bottom-right': return { x: width - pad - w, y: height - pad - h }
      default: return { x: pad, y: pad }
    }
  }

  // Get selected element's properties for the property panel
  const getSelectedProps = () => {
    if (!selectedId) return null
    const fm = FIELD_MAP[selectedId]
    if (!fm) return null
    const key = fm.fontKey
    return {
      field: selectedId,
      label: fm.label,
      font: state[`${key}Font`],
      color: state[`${key}Color`] || '',
      size: state[`${key}Size`],
    }
  }

  const selectedProps = getSelectedProps()

  // Selection outline dimensions
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
    <div className="fixed inset-0 z-50 bg-bg flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: '0.5px solid #E0E0DC', height: `${topBarHeight}px`, boxSizing: 'border-box' }}>
        <div>
          <p className="text-[11px] font-mono text-ink">{format.name}</p>
          <p className="text-[11px] font-mono text-secondary">{width}&times;{height} — Click elements to select, double-click to edit text</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1 text-[11px] font-mono text-secondary">
            <kbd className="px-1 py-0.5" style={{ border: '1px solid #E0E0DC', fontSize: '10px' }}>Esc</kbd>
            <span>deselect</span>
            <kbd className="px-1 py-0.5 ml-2" style={{ border: '1px solid #E0E0DC', fontSize: '10px' }}>⌘Z</kbd>
            <span>undo</span>
            <kbd className="px-1 py-0.5 ml-2" style={{ border: '1px solid #E0E0DC', fontSize: '10px' }}>Del</kbd>
            <span>clear</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="text-[11px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-[11px] font-mono px-3 py-1 bg-ink text-bg cursor-pointer hover:bg-bg hover:text-ink transition-all"
              style={{ border: '1px solid #0A0A0A' }}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Main area: canvas + property panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center dot-grid overflow-hidden">
          {/* Inline text editor overlay */}
          {editingText && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center"
              style={{ background: 'rgba(250,250,248,0.9)' }}
              onClick={handleTextEditDone}
            >
              <div onClick={e => e.stopPropagation()} className="w-[400px] space-y-3 bg-surface p-6" style={{ border: '1px solid #E0E0DC' }}>
                <p className="text-[11px] font-mono text-secondary uppercase">{editingText.field}</p>
                <textarea
                  autoFocus
                  value={editingText.value}
                  onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
                  className="w-full p-2 font-mono text-[13px] text-ink bg-transparent resize-none"
                  style={{ border: '1px solid #E0E0DC', minHeight: '80px' }}
                />
                <button
                  onClick={handleTextEditDone}
                  className="text-[11px] font-mono px-3 py-1 bg-ink text-bg cursor-pointer"
                  style={{ border: '1px solid #0A0A0A' }}
                >
                  Done
                </button>
              </div>
            </div>
          )}

          <Stage
            ref={stageRef}
            width={width * scale}
            height={height * scale}
            scaleX={scale}
            scaleY={scale}
            onClick={(e) => {
              if (e.target === e.target.getStage() || e.target.name() === 'bg') {
                setSelectedId(null)
                handleBgClick(e)
              }
            }}
            style={{ boxShadow: '0 4px 40px rgba(0,0,0,0.08)' }}
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

              {/* Focus point indicator */}
              {image && (
                <Group x={focusPoint.x * width} y={focusPoint.y * height} listening={false}>
                  <Rect x={-1} y={-12} width={2} height={24} fill="rgba(255,255,255,0.5)" />
                  <Rect x={-12} y={-1} width={24} height={2} fill="rgba(255,255,255,0.5)" />
                </Group>
              )}

              {/* Badge */}
              {badgeImage && (() => {
                const bh = badgeImgSz * (badgeImage.height / badgeImage.width)
                const bp = cornerPos(badgePosition, badgeImgSz, bh)
                return <KonvaImage image={badgeImage} x={bp.x} y={bp.y} width={badgeImgSz} height={bh} />
              })()}

              {badge && !badgeImage && (() => {
                const bw = Math.max(badge.length * badgeFontSize * 0.65, 60)
                const bh = badgeFontSize * 2.2
                const bp = cornerPos(badgePosition, bw, bh)
                return (
                  <Group x={bp.x} y={bp.y}>
                    <Rect width={bw} height={bh} fill={brandColor} />
                    <Text text={badge} width={bw} height={bh} align="center" verticalAlign="middle" fontSize={badgeFontSize} fontFamily={headlineFont} fontStyle="bold" fill="#FFFFFF" />
                  </Group>
                )
              })()}

              {/* Logo */}
              {logoImage && (() => {
                const lw = logoH * (logoImage.width / logoImage.height)
                const lp = cornerPos(logoPosition, lw, logoH)
                return <KonvaImage image={logoImage} x={lp.x} y={lp.y} height={logoH} width={lw} />
              })()}

              {/* Selection outline */}
              {selRect && (
                <Rect
                  x={selRect.x} y={selRect.y}
                  width={selRect.w} height={selRect.h}
                  stroke="#0A0A0A" strokeWidth={2} dash={[6, 3]}
                  listening={false}
                />
              )}

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

              <Rect x={0} y={height - 3} width={width} height={3} fill={brandColor} />
            </Layer>
          </Stage>
        </div>

        {/* Right property panel */}
        <div
          className="overflow-y-auto shrink-0"
          style={{
            width: `${panelWidth}px`,
            borderLeft: '0.5px solid #E0E0DC',
            background: '#FAFAF8',
          }}
        >
          <div className="p-5 space-y-5">
            {/* Element list */}
            <div>
              <p className="text-[11px] font-mono text-secondary uppercase tracking-[0.1em] mb-2">Elements</p>
              <div className="space-y-1">
                {[
                  { id: 'headline', label: 'Headline', active: !!headline },
                  { id: 'tagline', label: 'Tagline', active: !!tagline },
                  { id: 'subtext', label: 'Subtext', active: !!subtext },
                  { id: 'cta', label: 'CTA', active: !!ctaText },
                ].map(el => (
                  <button
                    key={el.id}
                    onClick={() => setSelectedId(el.active ? el.id : null)}
                    disabled={!el.active}
                    className="w-full text-left px-2 py-1.5 text-[11px] font-mono transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: selectedId === el.id ? '#0A0A0A' : 'transparent',
                      color: selectedId === el.id ? '#FAFAF8' : '#0A0A0A',
                      border: 'none',
                    }}
                  >
                    {el.label}
                    {!el.active && <span className="text-secondary ml-1">(empty)</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Selected element properties */}
            {selectedProps ? (
              <div className="space-y-4">
                <p className="text-[11px] font-mono text-ink uppercase tracking-[0.1em]">
                  {selectedProps.label}
                </p>

                {/* Font */}
                <div className="space-y-1">
                  <p className="text-[11px] font-mono text-secondary">Font</p>
                  <select
                    value={selectedProps.font}
                    onChange={(e) => dispatch({
                      type: 'SET_FIELD_FONT',
                      payload: { field: selectedProps.field, font: e.target.value },
                    })}
                    className="w-full text-[12px] font-mono text-ink bg-transparent px-2 py-1.5 cursor-pointer"
                    style={{ border: '1px solid #E0E0DC', outline: 'none' }}
                  >
                    {allFonts.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Size */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-mono text-secondary">Size</p>
                    <span className="text-[11px] font-mono text-ink">{selectedProps.size}px</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={120}
                    value={selectedProps.size}
                    onChange={(e) => dispatch({
                      type: 'SET_FIELD_SIZE',
                      payload: { field: selectedProps.field, size: Number(e.target.value) },
                    })}
                    className="w-full"
                    style={{ accentColor: '#0A0A0A' }}
                  />
                </div>

                {/* Color */}
                <div className="space-y-1">
                  <p className="text-[11px] font-mono text-secondary">Color</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedProps.color || autoTextColor}
                      onChange={(e) => dispatch({
                        type: 'SET_FIELD_COLOR',
                        payload: { field: selectedProps.field, color: e.target.value },
                      })}
                      className="w-8 h-8 p-0 cursor-pointer"
                      style={{ border: '1px solid #E0E0DC' }}
                    />
                    <input
                      type="text"
                      value={selectedProps.color || 'auto'}
                      onChange={(e) => dispatch({
                        type: 'SET_FIELD_COLOR',
                        payload: { field: selectedProps.field, color: e.target.value },
                      })}
                      placeholder="auto"
                      className="flex-1 text-[11px] font-mono text-ink bg-transparent px-2 py-1"
                      style={{ border: '1px solid #E0E0DC' }}
                    />
                    {selectedProps.color && (
                      <button
                        onClick={() => dispatch({
                          type: 'SET_FIELD_COLOR',
                          payload: { field: selectedProps.field, color: '' },
                        })}
                        className="text-[11px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer p-0"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTextDblClick(selectedId, selectedId === 'cta' ? ctaText : state[selectedId])}
                    className="flex-1 py-1.5 text-[11px] font-mono uppercase tracking-[0.08em] bg-transparent cursor-pointer transition-all hover:bg-ink hover:text-bg"
                    style={{ border: '1px solid #E0E0DC', color: '#0A0A0A' }}
                  >
                    Edit Text
                  </button>
                  <button
                    onClick={() => {
                      const fm = FIELD_MAP[selectedId]
                      if (fm) {
                        dispatch({ type: fm.action, payload: '' })
                        setSelectedId(null)
                      }
                    }}
                    className="py-1.5 px-3 text-[11px] font-mono uppercase tracking-[0.08em] bg-transparent cursor-pointer transition-all hover:bg-ink hover:text-bg"
                    style={{ border: '1px solid #E0E0DC', color: '#999994' }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[11px] font-mono text-secondary">
                  Click an element on the canvas to edit its properties
                </p>
                <p className="text-[11px] font-mono text-secondary mt-1 opacity-60">
                  Double-click to edit text inline
                </p>
              </div>
            )}

            <div className="h-px bg-border" />

            {/* Canvas info */}
            <div className="space-y-2">
              <p className="text-[11px] font-mono text-secondary uppercase tracking-[0.1em]">Canvas</p>
              <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                <span className="text-secondary">Format</span>
                <span className="text-ink">{format.name}</span>
                <span className="text-secondary">Size</span>
                <span className="text-ink">{width}&times;{height}</span>
                <span className="text-secondary">Scale</span>
                <span className="text-ink">{Math.round(scale * 100)}%</span>
                <span className="text-secondary">Focus</span>
                <span className="text-ink">{Math.round(focusPoint.x * 100)}%, {Math.round(focusPoint.y * 100)}%</span>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Position reset */}
            <button
              onClick={() => dispatch({ type: 'CLEAR_TEXT_POSITIONS' })}
              className="w-full py-1.5 text-[11px] font-mono text-secondary uppercase tracking-[0.08em] bg-transparent cursor-pointer transition-all hover:text-ink"
              style={{ border: '1px solid #E0E0DC' }}
            >
              Reset All Positions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
