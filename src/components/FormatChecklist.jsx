import { AD_FORMATS, getPlatformFolder } from '../utils/formats'

export default function FormatChecklist({ enabledFormats, onToggle }) {
  const platforms = [...new Set(AD_FORMATS.map(f => f.platform))]

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-heading font-semibold text-text-primary uppercase tracking-wide">
        Export Formats
      </h3>
      {platforms.map(platform => (
        <div key={platform} className="space-y-1">
          <p className="text-xs font-mono text-text-secondary uppercase tracking-wider">
            {getPlatformFolder(platform)}
          </p>
          {AD_FORMATS.filter(f => f.platform === platform).map(format => (
            <label
              key={format.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface/50 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={enabledFormats.includes(format.id)}
                onChange={() => onToggle(format.id)}
                className="w-3.5 h-3.5 rounded border-border accent-accent"
                aria-label={`Include ${format.name} in export`}
              />
              <span className="text-xs text-text-primary flex-1">{format.name}</span>
              <span className="text-[10px] font-mono text-text-secondary">
                {format.width}×{format.height}
              </span>
            </label>
          ))}
        </div>
      ))}
    </div>
  )
}
