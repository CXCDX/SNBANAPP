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
    <div className="space-y-4">
      <h3 className="font-editorial text-[18px] text-ink">
        Image
      </h3>
      <div
        {...getRootProps()}
        className={`cursor-pointer transition-opacity duration-200 ${isDragActive ? 'opacity-50' : ''}`}
        role="button"
        aria-label="Upload background image"
      >
        <input {...getInputProps()} aria-label="File input for background image" />
        {image ? (
          <div className="space-y-3">
            <img
              src={image.src}
              alt="Uploaded preview"
              className="w-full h-32 object-cover"
            />
            <p className="text-[11px] font-mono text-secondary truncate">{image.name}</p>
            <p className="text-[10px] font-mono text-secondary">
              {image.width} &times; {image.height}
            </p>
          </div>
        ) : (
          <div className="py-10 text-center" style={{ border: '1px dashed #E0E0DC' }}>
            <p className="font-editorial text-[14px] italic text-secondary">
              {isDragActive ? 'Drop here' : 'Drop image or click'}
            </p>
            <p className="text-[10px] font-mono text-secondary mt-2">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
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
