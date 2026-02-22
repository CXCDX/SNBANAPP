import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAppState, useAppDispatch } from '../store/AppContext'

export default function BadgeLibrary() {
  const { badgeLibrary, activeBadgeSrc } = useAppState()
  const dispatch = useAppDispatch()
  const [badgeName, setBadgeName] = useState('')
  const [pendingFile, setPendingFile] = useState(null)

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

  const handleSave = () => {
    if (!pendingFile || !badgeName.trim()) return
    dispatch({
      type: 'ADD_BADGE_TO_LIBRARY',
      payload: { id: Date.now(), name: badgeName.trim(), src: pendingFile.src },
    })
    dispatch({ type: 'ADD_TOAST', payload: { message: `Badge "${badgeName.trim()}" saved`, variant: 'success' } })
    setPendingFile(null)
    setBadgeName('')
  }

  const handleApply = (src) => {
    if (activeBadgeSrc === src) {
      dispatch({ type: 'CLEAR_ACTIVE_BADGE' })
    } else {
      dispatch({ type: 'SET_ACTIVE_BADGE', payload: src })
    }
  }

  return (
    <div className="space-y-5">
      <h3 className="font-editorial text-[18px] text-ink">
        Badges
      </h3>

      {/* Upload area */}
      <div className="space-y-3">
        <div
          {...getRootProps()}
          className="cursor-pointer"
          role="button"
          aria-label="Upload badge image"
        >
          <input {...getInputProps()} aria-label="File input for badge" />
          {pendingFile ? (
            <div className="flex items-center gap-3">
              <img src={pendingFile.src} alt="Badge preview" className="h-8 w-8 object-contain" />
              <span className="text-[11px] font-mono text-secondary truncate flex-1">{pendingFile.fileName}</span>
            </div>
          ) : (
            <p className="text-[11px] font-mono text-secondary hover:underline">Upload SVG or PNG</p>
          )}
        </div>

        {pendingFile && (
          <div className="space-y-2">
            <input
              type="text"
              value={badgeName}
              onChange={(e) => setBadgeName(e.target.value)}
              placeholder="Badge name"
              className="input-editorial"
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

      {/* Library grid */}
      {badgeLibrary.length > 0 && (
        <div className="space-y-2">
          <p className="font-editorial text-[13px] italic text-secondary">Library</p>
          <div className="grid grid-cols-3 gap-2">
            {badgeLibrary.map((badge) => (
              <button
                key={badge.id}
                onClick={() => handleApply(badge.src)}
                className="group flex flex-col items-center gap-1 p-2 bg-transparent border-none cursor-pointer"
                style={{
                  border: activeBadgeSrc === badge.src ? '1px solid #0A0A0A' : '1px solid transparent',
                }}
                aria-label={`Apply badge: ${badge.name}`}
                title={badge.name}
              >
                <img src={badge.src} alt={badge.name} className="h-8 w-8 object-contain" />
                <span className="text-[8px] font-mono text-secondary truncate w-full text-center group-hover:underline">
                  {badge.name}
                </span>
              </button>
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
