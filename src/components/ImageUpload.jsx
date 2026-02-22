import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAppState, useAppDispatch } from '../store/AppContext'
import { getImageLuminance } from '../utils/luminance'
import { AD_FORMATS } from '../utils/formats'
import FocusPointSelector from './FocusPointSelector'

const MIN_DIMENSION = 1000

export default function ImageUpload() {
  const { image } = useAppState()
  const dispatch = useAppDispatch()
  const [uploadError, setUploadError] = useState(null)

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setUploadError(null)

    const reader = new FileReader()
    reader.onerror = () => {
      setUploadError('Failed to read file')
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Failed to read image file', variant: 'error' } })
    }
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => {
        setUploadError('Invalid image file')
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Invalid image file', variant: 'error' } })
      }
      img.onload = () => {
        if (img.width < MIN_DIMENSION || img.height < MIN_DIMENSION) {
          setUploadError(`Image too small (${img.width}×${img.height}). Minimum ${MIN_DIMENSION}×${MIN_DIMENSION}px.`)
          dispatch({ type: 'ADD_TOAST', payload: { message: `Image must be at least ${MIN_DIMENSION}×${MIN_DIMENSION}px`, variant: 'error' } })
          return
        }
        setUploadError(null)
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
        // Initialize per-format focus points to center
        const formatKeys = AD_FORMATS.map(f => `${f.width}x${f.height}`)
        dispatch({ type: 'INIT_FOCUS_POINTS', payload: formatKeys })
        dispatch({ type: 'ADD_TOAST', payload: { message: `Loaded: ${file.name}`, variant: 'success' } })
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
      <div
        {...getRootProps()}
        className={`cursor-pointer transition-opacity duration-200 ${isDragActive ? 'opacity-50' : ''}`}
        role="button"
        aria-label="Upload background image"
      >
        <input {...getInputProps()} aria-label="File input for background image" />
        {image ? (
          <div className="space-y-1">
            <p className="text-[11px] font-mono text-secondary truncate">{image.name}</p>
            <p className="text-[11px] font-mono text-secondary">
              {image.width} &times; {image.height}
            </p>
          </div>
        ) : (
          <div
            className="py-6 text-center"
            style={{ border: `1px dashed ${uploadError ? '#FF3D57' : '#E0E0DC'}` }}
          >
            <p className="text-[11px] font-mono text-secondary">
              {isDragActive ? 'Drop here' : 'Drop image or click'}
            </p>
            <p className="text-[11px] font-mono text-secondary mt-1">PNG, JPG, WEBP — min {MIN_DIMENSION}×{MIN_DIMENSION}px</p>
            {uploadError && (
              <p className="text-[11px] font-mono mt-2" style={{ color: '#FF3D57' }}>
                {uploadError}
              </p>
            )}
          </div>
        )}
      </div>
      {image && <FocusPointSelector />}
      {image && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            dispatch({ type: 'CLEAR_IMAGE' })
          }}
          className="text-[11px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer p-0"
          aria-label="Remove uploaded image"
        >
          Remove
        </button>
      )}
    </div>
  )
}
