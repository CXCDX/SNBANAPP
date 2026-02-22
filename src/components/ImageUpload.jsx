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
    <div className="space-y-3">
      <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink">
        Image
      </h3>
      <div
        {...getRootProps()}
        className={`cursor-pointer transition-colors duration-200
          ${isDragActive ? 'opacity-60' : ''}
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
              className="w-full h-28 object-cover"
            />
            <p className="text-[10px] font-mono text-secondary truncate">{image.name}</p>
            <p className="text-[10px] font-mono text-secondary">
              {image.width} &times; {image.height} &mdash; L:{Math.round(image.luminance)}
            </p>
          </div>
        ) : (
          <div className="py-8 text-center" style={{ border: '0.5px dashed #E0E0DC' }}>
            <p className="text-[11px] font-mono text-secondary">
              {isDragActive ? 'Drop here' : 'Drop image or click'}
            </p>
            <p className="text-[10px] font-mono text-border mt-1">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
      {image && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            dispatch({ type: 'CLEAR_IMAGE' })
          }}
          className="text-[10px] font-mono text-secondary hover:underline transition-all"
          aria-label="Remove uploaded image"
        >
          Remove
        </button>
      )}
    </div>
  )
}
