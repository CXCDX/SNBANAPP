import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { saveBadge, getAllBadges, deleteBadge } from '../utils/indexedDB'

const POSITIONS = [
  { id: 'top-left', label: 'TL' },
  { id: 'top-right', label: 'TR' },
  { id: 'bottom-left', label: 'BL' },
  { id: 'bottom-right', label: 'BR' },
]

export default function BadgeLibrary() {
  const { badgeLibrary, activeBadgeSrc, badgePosition } = useAppState()
  const dispatch = useAppDispatch()
  const [badgeName, setBadgeName] = useState('')
  const [pendingFile, setPendingFile] = useState(null)

  // Load from IndexedDB on mount
  useEffect(() => {
    getAllBadges().then(badges => {
      if (badges && badges.length > 0) {
        dispatch({ type: 'SET_BADGE_LIBRARY', payload: badges })
      }
    }).catch(() => {})
  }, [dispatch])

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPendingFile({ src: reader.result, fileName: file.name })
      if (!badgeName) {
        setBadgeName(file.name.replace(/\.\w+$/, ''))
      }
    }
    reader.readAsDataURL(file)
  }, [badgeName])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.svg', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    multiple: false,
  })

  const handleSave = async () => {
    if (!pendingFile || !badgeName.trim()) return
    const badge = { id: Date.now(), name: badgeName.trim(), src: pendingFile.src }
    dispatch({ type: 'ADD_BADGE_TO_LIBRARY', payload: badge })
    await saveBadge(badge).catch(() => {})
    dispatch({ type: 'ADD_TOAST', payload: { message: `Badge "${badgeName.trim()}" saved`, variant: 'success' } })
    setPendingFile(null)
    setBadgeName('')
  }

  const handleDelete = async (id) => {
    dispatch({ type: 'REMOVE_BADGE_FROM_LIBRARY', payload: id })
    await deleteBadge(id).catch(() => {})
  }

  const handleApply = (src) => {
    if (activeBadgeSrc === src) {
      dispatch({ type: 'CLEAR_ACTIVE_BADGE' })
    } else {
      dispatch({ type: 'SET_ACTIVE_BADGE', payload: src })
    }
  }

  return (
    <div className="space-y-2">

      {/* Upload area */}
      <div className="space-y-1.5">
        <div
          {...getRootProps()}
          className="cursor-pointer"
          role="button"
          aria-label="Upload badge image"
        >
          <input {...getInputProps()} aria-label="File input for badge" />
          {pendingFile ? (
            <div className="flex items-center gap-2">
              <img src={pendingFile.src} alt="Badge preview" className="h-6 w-6 object-contain" />
              <span className="text-[11px] font-mono text-secondary truncate flex-1">{pendingFile.fileName}</span>
            </div>
          ) : (
            <p className="text-[11px] font-mono text-secondary hover:underline">Upload SVG or PNG</p>
          )}
        </div>

        {pendingFile && (
          <div className="space-y-1">
            <input
              type="text"
              value={badgeName}
              onChange={(e) => setBadgeName(e.target.value)}
              placeholder="Badge name"
              className="input-editorial"
              style={{ fontSize: '13px', padding: '4px 0' }}
              aria-label="Badge name"
            />
            <button
              onClick={handleSave}
              disabled={!badgeName.trim()}
              className="text-[11px] font-mono text-ink hover:underline bg-transparent border-none cursor-pointer p-0 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Save badge to library"
            >
              Save to library
            </button>
          </div>
        )}
      </div>

      {/* Position selector */}
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

      {/* Library grid */}
      {badgeLibrary.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-mono text-secondary">Library</p>
          <div className="grid grid-cols-3 gap-1.5">
            {badgeLibrary.map((badge) => (
              <div key={badge.id} className="relative group">
                <button
                  onClick={() => handleApply(badge.src)}
                  className="w-full flex flex-col items-center gap-0.5 p-1.5 bg-transparent border-none cursor-pointer"
                  style={{
                    border: activeBadgeSrc === badge.src ? '1px solid #0A0A0A' : '1px solid transparent',
                  }}
                  aria-label={`Apply badge: ${badge.name}`}
                  title={badge.name}
                >
                  <img src={badge.src} alt={badge.name} className="h-6 w-6 object-contain" />
                  <span className="text-[11px] font-mono text-secondary truncate w-full text-center">
                    {badge.name}
                  </span>
                </button>
                <button
                  onClick={() => handleDelete(badge.id)}
                  className="absolute -top-1 -right-1 w-3 h-3 text-[11px] leading-none bg-surface text-secondary hover:text-danger border border-border cursor-pointer hidden group-hover:flex items-center justify-center"
                  aria-label={`Delete badge ${badge.name}`}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          {activeBadgeSrc && (
            <button
              onClick={() => dispatch({ type: 'CLEAR_ACTIVE_BADGE' })}
              className="text-[11px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer p-0"
              aria-label="Remove badge from canvas"
            >
              Clear badge
            </button>
          )}
        </div>
      )}
    </div>
  )
}
