import { useRef, useCallback } from 'react'
import { useAppState, useAppDispatch } from '../store/AppContext'

export default function FocusPointSelector() {
  const { image, focusPoint } = useAppState()
  const dispatch = useAppDispatch()
  const containerRef = useRef(null)
  const dragging = useRef(false)

  const updatePoint = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    dispatch({ type: 'SET_FOCUS_POINT', payload: { x, y } })
  }, [dispatch])

  const handleDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    updatePoint(e)
  }, [updatePoint])

  const handleMove = useCallback((e) => {
    if (!dragging.current) return
    e.preventDefault()
    updatePoint(e)
  }, [updatePoint])

  const handleUp = useCallback(() => {
    dragging.current = false
  }, [])

  if (!image) return null

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-mono text-secondary">Focus point</p>
      <div
        ref={containerRef}
        className="relative cursor-crosshair select-none overflow-hidden"
        style={{ touchAction: 'none' }}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onTouchStart={handleDown}
        onTouchMove={handleMove}
        onTouchEnd={handleUp}
        role="slider"
        aria-label="Drag to set image focus point"
        aria-valuetext={`${Math.round(focusPoint.x * 100)}% horizontal, ${Math.round(focusPoint.y * 100)}% vertical`}
      >
        <img
          src={image.src}
          alt="Focus point selector"
          className="w-full h-auto block"
          draggable={false}
          style={{ maxHeight: '140px', objectFit: 'cover', width: '100%' }}
        />
        {/* Crosshair overlay */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${focusPoint.x * 100}%`,
            top: `${focusPoint.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Outer ring */}
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '2px solid #FFFFFF',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(0,0,0,0.4)',
            }}
          />
          {/* Center dot */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#FFFFFF',
              boxShadow: '0 0 2px rgba(0,0,0,0.6)',
            }}
          />
        </div>
        {/* Crosshair lines */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${focusPoint.x * 100}%`,
            top: 0,
            bottom: 0,
            width: '1px',
            background: 'rgba(255,255,255,0.35)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: `${focusPoint.y * 100}%`,
            left: 0,
            right: 0,
            height: '1px',
            background: 'rgba(255,255,255,0.35)',
          }}
        />
      </div>
    </div>
  )
}
