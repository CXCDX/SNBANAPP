import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { getImageLuminance } from '../utils/luminance'

export default function ImageUpload() {
  const { image } = useAppState()
  const dispatch = useAppDispatch()

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const luminance = getImageLuminance(img)
        dispatch({
          type: 'SET_IMAGE',
          payload: {
            src: reader.result,
            name: file.name,
            width: img.width,
            height: img.height,
            luminance,
          },
        })
        dispatch({ type: 'ADD_TOAST', payload: { message: `Image loaded: ${file.name}`, variant: 'success' } })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }, [dispatch])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    multiple: false,
  })

  return (
    <div className="space-y-2">
      <label className="text-xs font-mono text-text-secondary uppercase tracking-wider">
        Background Image
      </label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200
          ${isDragActive
            ? 'border-accent bg-accent/10'
            : 'border-border hover:border-accent/50 hover:shadow-[0_0_12px_rgba(0,196,255,0.1)]'
          }
        `}
        role="button"
        aria-label="Upload background image by dropping a file or clicking to browse"
      >
        <input {...getInputProps()} aria-label="File input for background image" />
        {image ? (
          <div className="space-y-2">
            <img
              src={image.src}
              alt="Uploaded preview"
              className="w-full h-24 object-cover rounded"
            />
            <p className="text-xs text-text-secondary truncate">{image.name}</p>
            <p className="text-xs text-text-secondary">
              {image.width}×{image.height} — Luminance: {Math.round(image.luminance)}
            </p>
          </div>
        ) : (
          <div className="py-4">
            <svg className="w-8 h-8 mx-auto mb-2 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-text-secondary">
              {isDragActive ? 'Drop image here...' : 'Drag & drop or click'}
            </p>
            <p className="text-xs text-text-secondary mt-1">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
      {image && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            dispatch({ type: 'CLEAR_IMAGE' })
          }}
          className="text-xs text-text-secondary hover:text-danger transition-colors"
          aria-label="Remove uploaded image"
        >
          Remove image
        </button>
      )}
    </div>
  )
}
