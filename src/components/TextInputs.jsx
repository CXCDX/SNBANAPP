import { useAppState, useAppDispatch, DEFAULT_FONTS } from '../store/AppContext'

function FontSelect({ field, value }) {
  const { customFonts } = useAppState()
  const dispatch = useAppDispatch()
  const allFonts = [...DEFAULT_FONTS, ...customFonts.map(f => f.name)]

  return (
    <select
      value={value}
      onChange={(e) => dispatch({ type: 'SET_FIELD_FONT', payload: { field, font: e.target.value } })}
      className="w-full bg-transparent border-none text-[11px] font-mono text-secondary cursor-pointer p-0 focus:outline-none"
      style={{ borderBottom: '1px solid #E0E0DC', paddingBottom: '1px' }}
      aria-label={`Font for ${field}`}
    >
      {allFonts.map((f) => (
        <option key={f} value={f}>{f}</option>
      ))}
    </select>
  )
}

function ColorPicker({ field, value, autoColor }) {
  const dispatch = useAppDispatch()
  const displayColor = value || autoColor || '#F5F5F5'
  const isAuto = !value

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={displayColor}
        onChange={(e) => dispatch({ type: 'SET_FIELD_COLOR', payload: { field, color: e.target.value } })}
        className="w-4 h-4"
        aria-label={`Color for ${field}`}
      />
      <span className="text-[11px] font-mono text-secondary">
        {isAuto ? 'auto' : value}
      </span>
      {!isAuto && (
        <button
          onClick={() => dispatch({ type: 'SET_FIELD_COLOR', payload: { field, color: '' } })}
          className="text-[11px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer p-0"
          aria-label="Reset to auto color"
        >
          reset
        </button>
      )}
    </div>
  )
}

function SizeSlider({ field, value }) {
  const dispatch = useAppDispatch()
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="range"
        min="12"
        max="96"
        value={value}
        onChange={(e) => dispatch({ type: 'SET_FIELD_SIZE', payload: { field, size: Number(e.target.value) } })}
        className="flex-1 h-0.5 appearance-none bg-border cursor-pointer"
        style={{ accentColor: '#0A0A0A' }}
        aria-label={`Size for ${field}`}
      />
      <span className="text-[11px] font-mono text-secondary w-6 text-right">{value}</span>
    </div>
  )
}

function CharInput({ label, field, value, onChange, maxLength, placeholder, font, color, autoColor, size }) {
  const atLimit = maxLength && value.length >= maxLength
  const counterColor = atLimit ? 'text-danger' : 'text-secondary'

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <label className="text-[11px] font-mono text-ink">
          {label}
        </label>
        {maxLength && (
          <span className={`text-[11px] font-mono tabular-nums ${counterColor} transition-colors`}>
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
        style={{ fontSize: '13px', padding: '4px 0' }}
        aria-label={label}
      />
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <FontSelect field={field} value={font} />
        </div>
        <ColorPicker field={field} value={color} autoColor={autoColor} />
      </div>
      {size !== undefined && (
        <SizeSlider field={field} value={size} />
      )}
    </div>
  )
}

export default function TextInputs() {
  const state = useAppState()
  const dispatch = useAppDispatch()

  return (
    <div className="space-y-3">
      <CharInput
        label="Headline"
        field="headline"
        value={state.headline}
        onChange={(v) => dispatch({ type: 'SET_HEADLINE', payload: v })}
        maxLength={30}
        placeholder="Main headline text"
        font={state.headlineFont}
        color={state.headlineColor}
        size={state.headlineSize}
      />
      <CharInput
        label="Tagline"
        field="tagline"
        value={state.tagline}
        onChange={(v) => dispatch({ type: 'SET_TAGLINE', payload: v })}
        placeholder="3 Makine Bir Arada"
        font={state.taglineFont}
        color={state.taglineColor}
        size={state.taglineSize}
      />
      <CharInput
        label="Subtext"
        field="subtext"
        value={state.subtext}
        onChange={(v) => dispatch({ type: 'SET_SUBTEXT', payload: v })}
        maxLength={90}
        placeholder="Supporting description"
        font={state.subtextFont}
        color={state.subtextColor}
        size={state.subtextSize}
      />
      <CharInput
        label="CTA Button"
        field="cta"
        value={state.ctaText}
        onChange={(v) => dispatch({ type: 'SET_CTA', payload: v })}
        placeholder="Shop Now"
        font={state.ctaFont}
        color={state.ctaColor}
        size={state.ctaSize}
      />
      <CharInput
        label="Badge"
        field="badge"
        value={state.badge}
        onChange={(v) => dispatch({ type: 'SET_BADGE', payload: v })}
        placeholder="-20% OFF"
        font={state.headlineFont}
        color=""
      />
    </div>
  )
}
