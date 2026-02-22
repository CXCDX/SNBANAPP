import { useAppState, useAppDispatch } from '../store/AppContext'

function CharInput({ label, value, onChange, maxLength, placeholder }) {
  const atLimit = maxLength && value.length >= maxLength
  const counterColor = atLimit ? 'text-danger' : 'text-secondary'

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-secondary">
          {label}
        </label>
        {maxLength && (
          <span className={`text-[10px] font-mono tabular-nums ${counterColor} transition-colors`}>
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
        className="input-editorial"
        aria-label={label}
      />
    </div>
  )
}

export default function TextInputs() {
  const { headline, subtext, ctaText, badge } = useAppState()
  const dispatch = useAppDispatch()

  return (
    <div className="space-y-5">
      <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink">
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
        label="Badge"
        value={badge}
        onChange={(v) => dispatch({ type: 'SET_BADGE', payload: v })}
        placeholder="-20% OFF"
      />
    </div>
  )
}
