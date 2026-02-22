import ImageUpload from './ImageUpload'
import TextInputs from './TextInputs'
import BrandSettings from './BrandSettings'

export default function LeftPanel({ className = '' }) {
  return (
    <aside
      className={`w-60 shrink-0 bg-surface border-r border-border overflow-y-auto ${className}`}
      aria-label="Controls panel"
    >
      <div className="p-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-lg font-heading font-bold text-text-primary tracking-wide uppercase">
            Banner Studio
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">SharkNinja Turkey</p>
        </div>

        <div className="h-px bg-border" />

        <ImageUpload />

        <div className="h-px bg-border" />

        <TextInputs />

        <div className="h-px bg-border" />

        <BrandSettings />
      </div>
    </aside>
  )
}
