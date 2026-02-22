import { AD_FORMATS, getPlatformFolder } from '../utils/formats'

export default function FormatChecklist({ enabledFormats, onToggle }) {
  const platforms = [...new Set(AD_FORMATS.map(f => f.platform))]

  return (
    <div className="space-y-3">
      {platforms.map(platform => (
        <div key={platform} className="space-y-1.5">
          <p className="text-[9px] font-mono text-secondary">
            {getPlatformFolder(platform)}
          </p>
          {AD_FORMATS.filter(f => f.platform === platform).map(format => (
            <label
              key={format.id}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={enabledFormats.includes(format.id)}
                onChange={() => onToggle(format.id)}
                className="checkbox-editorial"
                aria-label={`Include ${format.name} in export`}
              />
              <span className="text-[10px] font-mono text-ink flex-1 group-hover:underline">
                {format.name.toUpperCase()}
              </span>
              <span className="text-[9px] font-mono text-secondary">
                {format.width}&times;{format.height}
              </span>
            </label>
          ))}
        </div>
      ))}
    </div>
  )
}
