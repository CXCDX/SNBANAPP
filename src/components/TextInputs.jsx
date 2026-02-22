import { useAppState, useAppDispatch } from '../store/AppContext'

function CharInput({ label, value, onChange, maxLength, placeholder }) {
  const ratio = maxLength ? value.length / maxLength : 0
  const isWarning = ratio >= 0.9
  const counterColor = isWarning ? 'text-danger' : 'text-text-secondary'

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-xs font-mono text-text-secondary uppercase tracking-wider">
          {label}
        </label>
        {maxLength && (
          <span className={`text-xs font-mono ${counterColor} transition-colors`}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
          focus:border-accent focus:shadow-[0_0_8px_rgba(0,196,255,0.25)] focus:outline-none transition-all duration-200"
        aria-label={label}
      />
    </div>
  )
}

export default function TextInputs() {
  const { headline, subtext, ctaText, badge } = useAppState()
  const dispatch = useAppDispatch()

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-heading font-semibold text-text-primary uppercase tracking-wide">
        Text Content
      </h3>
      <CharInput
        label="Headline"
        value={headline}
        onChange={(v) => dispatch({ type: 'SET_HEADLINE', payload: v })}
        maxLength={30}
        placeholder="Main headline text"
      />
      <CharInput
        label="Subtext"
        value={subtext}
        onChange={(v) => dispatch({ type: 'SET_SUBTEXT', payload: v })}
        maxLength={90}
        placeholder="Supporting description"
      />
      <CharInput
        label="CTA Button"
        value={ctaText}
        onChange={(v) => dispatch({ type: 'SET_CTA', payload: v })}
        placeholder="Shop Now"
      />
      <CharInput
        label="Badge (optional)"
        value={badge}
        onChange={(v) => dispatch({ type: 'SET_BADGE', payload: v })}
        placeholder="-20% OFF"
      />
    </div>
  )
}
