import { useMemo, useRef, useEffect } from 'react'
import { useAppState, useAppDispatch, DEFAULT_FONTS } from '../store/AppContext'

const SHAPES = [
  { id: 'circle', label: '○', title: 'Circle' },
  { id: 'rectangle', label: '□', title: 'Rectangle' },
  { id: 'pill', label: '⬡', title: 'Pill' },
  { id: 'starburst', label: '★', title: 'Starburst' },
]

const POSITIONS = [
  { id: 'top-left', label: 'TL' },
  { id: 'top-right', label: 'TR' },
  { id: 'bottom-left', label: 'BL' },
  { id: 'bottom-right', label: 'BR' },
]

const ALIGN_OPTIONS = [
  { id: 'left', label: 'L' },
  { id: 'center', label: 'C' },
  { id: 'right', label: 'R' },
]

function BadgePreview({ shape, bgColor, textColor, borderColor, borderWidth, fontFamily, fontSize, bold, italic, textAlign, line1, line2, line3, rotation }) {
  const canvasRef = useRef(null)
  const lines = [line1, line2, line3].filter(Boolean)
  const text = lines.join('\n')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 120
    canvas.width = size
    canvas.height = size
    ctx.clearRect(0, 0, size, size)

    const half = size / 2
    ctx.save()
    ctx.translate(half, half)
    ctx.rotate((rotation || 0) * Math.PI / 180)

    // Draw shape
    ctx.fillStyle = bgColor || '#FF3D57'
    if (shape === 'circle') {
      ctx.beginPath()
      ctx.arc(0, 0, half - 4, 0, Math.PI * 2)
      ctx.fill()
      if (borderWidth > 0) { ctx.strokeStyle = borderColor; ctx.lineWidth = borderWidth; ctx.stroke() }
    } else if (shape === 'rectangle') {
      ctx.fillRect(-half + 4, -half + 4, size - 8, size - 8)
      if (borderWidth > 0) { ctx.strokeStyle = borderColor; ctx.lineWidth = borderWidth; ctx.strokeRect(-half + 4, -half + 4, size - 8, size - 8) }
    } else if (shape === 'pill') {
      const pw = size - 8
      const ph = (size - 8) * 0.55
      const r = ph / 2
      ctx.beginPath()
      ctx.moveTo(-pw / 2 + r, -ph / 2)
      ctx.lineTo(pw / 2 - r, -ph / 2)
      ctx.arc(pw / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2)
      ctx.lineTo(-pw / 2 + r, ph / 2)
      ctx.arc(-pw / 2 + r, 0, r, Math.PI / 2, -Math.PI / 2)
      ctx.closePath()
      ctx.fill()
      if (borderWidth > 0) { ctx.strokeStyle = borderColor; ctx.lineWidth = borderWidth; ctx.stroke() }
    } else if (shape === 'starburst') {
      const outer = half - 4
      const inner = outer * 0.7
      const points = 12
      ctx.beginPath()
      for (let i = 0; i < points * 2; i++) {
        const r2 = i % 2 === 0 ? outer : inner
        const a = (Math.PI * i) / points - Math.PI / 2
        ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r2, Math.sin(a) * r2)
      }
      ctx.closePath()
      ctx.fill()
      if (borderWidth > 0) { ctx.strokeStyle = borderColor; ctx.lineWidth = borderWidth; ctx.stroke() }
    }

    // Draw text
    if (lines.length > 0) {
      const fSize = Math.min(fontSize || 12, 16)
      const style = `${bold ? 'bold' : ''} ${italic ? 'italic' : ''}`.trim() || 'normal'
      ctx.font = `${style} ${fSize}px "${fontFamily || 'Barlow Condensed'}", sans-serif`
      ctx.fillStyle = textColor || '#FFFFFF'
      ctx.textAlign = textAlign || 'center'
      ctx.textBaseline = 'middle'
      const lineH = fSize * 1.3
      const totalH = lines.length * lineH
      const startY = -totalH / 2 + lineH / 2
      lines.forEach((line, i) => {
        const tx = textAlign === 'left' ? -half + 12 : textAlign === 'right' ? half - 12 : 0
        ctx.fillText(line, tx, startY + i * lineH)
      })
    }

    ctx.restore()
  }, [shape, bgColor, textColor, borderColor, borderWidth, fontFamily, fontSize, bold, italic, textAlign, line1, line2, line3, rotation, lines, text])

  return (
    <div className="flex items-center justify-center" style={{ background: '#1E1E1E', padding: '8px', border: '1px solid #E0E0DC' }}>
      <canvas ref={canvasRef} width={120} height={120} style={{ width: '120px', height: '120px' }} />
    </div>
  )
}

export default function BadgeLibrary() {
  const {
    badgeEnabled,
    badgeShape, badgeBgColor, badgeTextColor, badgeBorderColor, badgeBorderWidth,
    badgeFontFamily, badgeFontSize, badgeBold, badgeItalic, badgeTextAlign,
    badgeLine1, badgeLine2, badgeLine3,
    badgeSize, badgePosition, badgeRotation, customFonts,
  } = useAppState()
  const dispatch = useAppDispatch()

  const allFonts = useMemo(() => {
    const custom = customFonts?.map(f => f.name) || []
    return [...DEFAULT_FONTS, ...custom]
  }, [customFonts])

  const hasBadgeText = badgeLine1 || badgeLine2 || badgeLine3

  return (
    <div className="space-y-3">

      {/* Show/hide badge toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={badgeEnabled}
          onChange={e => dispatch({ type: 'SET_BADGE_ENABLED', payload: e.target.checked })}
          className="checkbox-editorial"
        />
        <span className="text-[12px] font-mono text-ink">Show badge on canvas</span>
      </label>

      {/* Live preview */}
      <BadgePreview
        shape={badgeShape} bgColor={badgeBgColor} textColor={badgeTextColor}
        borderColor={badgeBorderColor} borderWidth={badgeBorderWidth}
        fontFamily={badgeFontFamily} fontSize={badgeFontSize}
        bold={badgeBold} italic={badgeItalic} textAlign={badgeTextAlign}
        line1={badgeLine1} line2={badgeLine2} line3={badgeLine3}
        rotation={badgeRotation}
      />

      {!hasBadgeText && !badgeEnabled && (
        <p className="text-[10px] font-mono text-secondary text-center" style={{ color: '#999994' }}>
          Type text below to add badge to canvas
        </p>
      )}

      {/* Text inputs (3 lines) — FIRST so users type immediately */}
      <div className="space-y-1">
        <p className="text-[11px] font-mono text-secondary">Badge Text</p>
        <input
          type="text"
          value={badgeLine1}
          onChange={e => dispatch({ type: 'SET_BADGE_LINE1', payload: e.target.value })}
          placeholder="Line 1 (e.g. -20%)"
          maxLength={20}
          className="w-full text-[12px] font-mono text-ink bg-transparent px-2 py-1"
          style={{ border: '1px solid #E0E0DC', outline: 'none' }}
        />
        <input
          type="text"
          value={badgeLine2}
          onChange={e => dispatch({ type: 'SET_BADGE_LINE2', payload: e.target.value })}
          placeholder="Line 2"
          maxLength={20}
          className="w-full text-[12px] font-mono text-ink bg-transparent px-2 py-1"
          style={{ border: '1px solid #E0E0DC', outline: 'none' }}
        />
        <input
          type="text"
          value={badgeLine3}
          onChange={e => dispatch({ type: 'SET_BADGE_LINE3', payload: e.target.value })}
          placeholder="Line 3"
          maxLength={20}
          className="w-full text-[12px] font-mono text-ink bg-transparent px-2 py-1"
          style={{ border: '1px solid #E0E0DC', outline: 'none' }}
        />
      </div>

      {/* Shape selector */}
      <div className="space-y-1">
        <p className="text-[11px] font-mono text-secondary">Shape</p>
        <div className="flex gap-1">
          {SHAPES.map(s => (
            <button
              key={s.id}
              onClick={() => dispatch({ type: 'SET_BADGE_SHAPE', payload: s.id })}
              title={s.title}
              className="w-9 h-9 flex items-center justify-center cursor-pointer transition-all"
              style={{
                fontSize: '18px',
                background: badgeShape === s.id ? '#0A0A0A' : 'transparent',
                color: badgeShape === s.id ? '#FAFAF8' : '#999994',
                border: '1px solid ' + (badgeShape === s.id ? '#0A0A0A' : '#E0E0DC'),
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color controls */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-mono text-secondary">Colors</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-0.5">
            <p className="text-[10px] font-mono text-secondary">Background</p>
            <input
              type="color"
              value={badgeBgColor}
              onChange={e => dispatch({ type: 'SET_BADGE_BG_COLOR', payload: e.target.value })}
              className="w-full h-7 p-0 cursor-pointer"
              style={{ border: '1px solid #E0E0DC' }}
            />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-mono text-secondary">Text</p>
            <input
              type="color"
              value={badgeTextColor}
              onChange={e => dispatch({ type: 'SET_BADGE_TEXT_COLOR', payload: e.target.value })}
              className="w-full h-7 p-0 cursor-pointer"
              style={{ border: '1px solid #E0E0DC' }}
            />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-mono text-secondary">Border</p>
            <input
              type="color"
              value={badgeBorderColor}
              onChange={e => dispatch({ type: 'SET_BADGE_BORDER_COLOR', payload: e.target.value })}
              className="w-full h-7 p-0 cursor-pointer"
              style={{ border: '1px solid #E0E0DC' }}
            />
          </div>
        </div>
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <p className="text-[10px] font-mono text-secondary">Border width</p>
            <p className="text-[10px] font-mono text-secondary">{badgeBorderWidth}px</p>
          </div>
          <input
            type="range" min="0" max="4" step="1"
            value={badgeBorderWidth}
            onChange={e => dispatch({ type: 'SET_BADGE_BORDER_WIDTH', payload: Number(e.target.value) })}
            className="w-full h-1 appearance-none bg-border cursor-pointer"
            style={{ accentColor: '#0A0A0A' }}
          />
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-mono text-secondary">Typography</p>
        <select
          value={badgeFontFamily}
          onChange={e => dispatch({ type: 'SET_BADGE_FONT_FAMILY', payload: e.target.value })}
          className="w-full text-[12px] font-mono text-ink bg-transparent px-2 py-1.5 cursor-pointer"
          style={{ border: '1px solid #E0E0DC', outline: 'none' }}
        >
          {allFonts.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <div className="flex gap-2 items-center">
          <div className="flex-1 space-y-0.5">
            <div className="flex justify-between">
              <p className="text-[10px] font-mono text-secondary">Size</p>
              <p className="text-[10px] font-mono text-secondary">{badgeFontSize}px</p>
            </div>
            <input
              type="range" min="8" max="24" step="1"
              value={badgeFontSize}
              onChange={e => dispatch({ type: 'SET_BADGE_FONT_SIZE', payload: Number(e.target.value) })}
              className="w-full h-1 appearance-none bg-border cursor-pointer"
              style={{ accentColor: '#0A0A0A' }}
            />
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_BADGE_BOLD', payload: !badgeBold })}
            className="w-7 h-7 flex items-center justify-center cursor-pointer transition-all text-[13px] font-bold"
            style={{
              background: badgeBold ? '#0A0A0A' : 'transparent',
              color: badgeBold ? '#FAFAF8' : '#999994',
              border: '1px solid ' + (badgeBold ? '#0A0A0A' : '#E0E0DC'),
            }}
          >
            B
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_BADGE_ITALIC', payload: !badgeItalic })}
            className="w-7 h-7 flex items-center justify-center cursor-pointer transition-all text-[13px] italic"
            style={{
              background: badgeItalic ? '#0A0A0A' : 'transparent',
              color: badgeItalic ? '#FAFAF8' : '#999994',
              border: '1px solid ' + (badgeItalic ? '#0A0A0A' : '#E0E0DC'),
            }}
          >
            I
          </button>
        </div>
        <div className="flex gap-1">
          {ALIGN_OPTIONS.map(a => (
            <button
              key={a.id}
              onClick={() => dispatch({ type: 'SET_BADGE_TEXT_ALIGN', payload: a.id })}
              className="flex-1 text-[11px] font-mono py-1 cursor-pointer transition-all text-center"
              style={{
                background: badgeTextAlign === a.id ? '#0A0A0A' : 'transparent',
                color: badgeTextAlign === a.id ? '#FAFAF8' : '#999994',
                border: '1px solid ' + (badgeTextAlign === a.id ? '#0A0A0A' : '#E0E0DC'),
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <p className="text-[11px] font-mono text-secondary">Size</p>
          <p className="text-[11px] font-mono text-secondary">{badgeSize}px</p>
        </div>
        <input
          type="range" min="40" max="300"
          value={badgeSize}
          onChange={e => dispatch({ type: 'SET_BADGE_SIZE', payload: Number(e.target.value) })}
          className="w-full h-1 appearance-none bg-border cursor-pointer"
          style={{ accentColor: '#0A0A0A' }}
        />
      </div>

      {/* Position */}
      <div className="space-y-1">
        <p className="text-[11px] font-mono text-secondary">Position</p>
        <div className="grid grid-cols-4 gap-1">
          {POSITIONS.map(pos => (
            <button
              key={pos.id}
              onClick={() => dispatch({ type: 'SET_BADGE_POSITION', payload: pos.id })}
              className="text-[11px] font-mono py-1 cursor-pointer transition-all text-center"
              style={{
                background: badgePosition === pos.id ? '#0A0A0A' : 'transparent',
                color: badgePosition === pos.id ? '#FAFAF8' : '#999994',
                border: '1px solid ' + (badgePosition === pos.id ? '#0A0A0A' : '#E0E0DC'),
              }}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <p className="text-[11px] font-mono text-secondary">Rotation</p>
          <p className="text-[11px] font-mono text-secondary">{badgeRotation}°</p>
        </div>
        <input
          type="range" min="-45" max="45" step="1"
          value={badgeRotation}
          onChange={e => dispatch({ type: 'SET_BADGE_ROTATION', payload: Number(e.target.value) })}
          className="w-full h-1 appearance-none bg-border cursor-pointer"
          style={{ accentColor: '#0A0A0A' }}
        />
      </div>

      {/* Clear badge */}
      {hasBadgeText && (
        <button
          onClick={() => {
            dispatch({ type: 'SET_BADGE_LINE1', payload: '' })
            dispatch({ type: 'SET_BADGE_LINE2', payload: '' })
            dispatch({ type: 'SET_BADGE_LINE3', payload: '' })
          }}
          className="text-[11px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer p-0"
        >
          Clear badge text
        </button>
      )}
    </div>
  )
}
