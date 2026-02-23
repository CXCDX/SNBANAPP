import { useAppState, useAppDispatch, DEFAULT_FONTS } from '../store/AppContext'

function FontSelect({ field, value, layerId }) {
  const { customFonts } = useAppState()
  const dispatch = useAppDispatch()
  const allFonts = [...DEFAULT_FONTS, ...customFonts.map(f => f.name)]

  const handleChange = (e) => {
    if (layerId) {
      dispatch({ type: 'UPDATE_TEXT_LAYER', payload: { id: layerId, key: 'font', value: e.target.value } })
    } else {
      dispatch({ type: 'SET_FIELD_FONT', payload: { field, font: e.target.value } })
    }
  }

  return (
    <select
      value={value}
      onChange={handleChange}
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

function ColorPicker({ field, value, autoColor, layerId }) {
  const dispatch = useAppDispatch()
  const displayColor = value || autoColor || '#F5F5F5'
  const isAuto = !value

  const handleChange = (e) => {
    if (layerId) {
      dispatch({ type: 'UPDATE_TEXT_LAYER', payload: { id: layerId, key: 'color', value: e.target.value } })
    } else {
      dispatch({ type: 'SET_FIELD_COLOR', payload: { field, color: e.target.value } })
    }
  }

  const handleReset = () => {
    if (layerId) {
      dispatch({ type: 'UPDATE_TEXT_LAYER', payload: { id: layerId, key: 'color', value: '' } })
    } else {
      dispatch({ type: 'SET_FIELD_COLOR', payload: { field, color: '' } })
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={displayColor}
        onChange={handleChange}
        className="w-4 h-4"
        aria-label={`Color for ${field}`}
      />
      <span className="text-[11px] font-mono text-secondary">
        {isAuto ? 'auto' : value}
      </span>
      {!isAuto && (
        <button
          onClick={handleReset}
          className="text-[11px] font-mono text-secondary hover:underline bg-transparent border-none cursor-pointer p-0"
          aria-label="Reset to auto color"
        >
          reset
        </button>
      )}
    </div>
  )
}

function SizeSlider({ field, value, layerId }) {
  const dispatch = useAppDispatch()

  const handleChange = (e) => {
    if (layerId) {
      dispatch({ type: 'UPDATE_TEXT_LAYER', payload: { id: layerId, key: 'size', value: Number(e.target.value) } })
    } else {
      dispatch({ type: 'SET_FIELD_SIZE', payload: { field, size: Number(e.target.value) } })
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="range"
        min="12"
        max="96"
        value={value}
        onChange={handleChange}
        className="flex-1 h-0.5 appearance-none bg-border cursor-pointer"
        style={{ accentColor: '#0A0A0A' }}
        aria-label={`Size for ${field}`}
      />
      <span className="text-[11px] font-mono text-secondary w-6 text-right">{value}</span>
    </div>
  )
}

function CharInput({ label, field, value, onChange, maxLength, placeholder, font, color, autoColor, size, layerId }) {
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
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={1}
        className="input-editorial w-full resize-none"
        style={{
          fontSize: '13px',
          padding: '4px 0',
          minHeight: '28px',
          overflow: 'hidden',
          fieldSizing: 'content',
        }}
        aria-label={label}
        onInput={(e) => {
          e.target.style.height = 'auto'
          e.target.style.height = e.target.scrollHeight + 'px'
        }}
      />
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <FontSelect field={field} value={font} layerId={layerId} />
        </div>
        <ColorPicker field={field} value={color} autoColor={autoColor} layerId={layerId} />
      </div>
      {size !== undefined && (
        <SizeSlider field={field} value={size} layerId={layerId} />
      )}
    </div>
  )
}

function ExtraLayerInput({ layer, autoColor }) {
  const dispatch = useAppDispatch()

  return (
    <div className="space-y-1 relative" style={{ paddingLeft: '8px', borderLeft: '2px solid #E0E0DC' }}>
      <div className="flex justify-between items-baseline">
        <label className="text-[11px] font-mono text-secondary">
          {layer.type}
        </label>
        <button
          onClick={() => dispatch({ type: 'REMOVE_TEXT_LAYER', payload: layer.id })}
          className="text-[11px] font-mono text-secondary hover:text-ink bg-transparent border-none cursor-pointer p-0"
          aria-label={`Remove ${layer.type} layer`}
        >
          &times;
        </button>
      </div>
      <textarea
        value={layer.content}
        onChange={(e) => dispatch({ type: 'UPDATE_TEXT_LAYER', payload: { id: layer.id, key: 'content', value: e.target.value } })}
        placeholder={`${layer.type} text`}
        rows={1}
        className="input-editorial w-full resize-none"
        style={{
          fontSize: '13px',
          padding: '4px 0',
          minHeight: '28px',
          overflow: 'hidden',
          fieldSizing: 'content',
        }}
        aria-label={`${layer.type} layer`}
        onInput={(e) => {
          e.target.style.height = 'auto'
          e.target.style.height = e.target.scrollHeight + 'px'
        }}
      />
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <FontSelect field={layer.type} value={layer.font} layerId={layer.id} />
        </div>
        <ColorPicker field={layer.type} value={layer.color} autoColor={autoColor} layerId={layer.id} />
      </div>
      <SizeSlider field={layer.type} value={layer.size} layerId={layer.id} />
    </div>
  )
}

function SectionHeader({ label, type }) {
  const dispatch = useAppDispatch()

  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-mono text-ink uppercase tracking-[0.08em]">{label}</span>
      <button
        onClick={() => dispatch({ type: 'ADD_TEXT_LAYER', payload: { type } })}
        className="text-[13px] font-mono text-secondary hover:text-ink bg-transparent border-none cursor-pointer p-0 leading-none"
        aria-label={`Add ${label} layer`}
        title={`Add another ${label.toLowerCase()}`}
      >
        +
      </button>
    </div>
  )
}

export default function TextInputs() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const extraLayers = state.extraTextLayers || []

  const headlineExtras = extraLayers.filter(l => l.type === 'headline')
  const taglineExtras = extraLayers.filter(l => l.type === 'tagline')
  const subtextExtras = extraLayers.filter(l => l.type === 'subtext')

  return (
    <div className="space-y-3">
      <SectionHeader label="Headline" type="headline" />
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
      {headlineExtras.map(layer => (
        <ExtraLayerInput key={layer.id} layer={layer} autoColor="" />
      ))}

      <SectionHeader label="Tagline" type="tagline" />
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
      {taglineExtras.map(layer => (
        <ExtraLayerInput key={layer.id} layer={layer} autoColor="" />
      ))}

      <SectionHeader label="Subtext" type="subtext" />
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
      {subtextExtras.map(layer => (
        <ExtraLayerInput key={layer.id} layer={layer} autoColor="" />
      ))}

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
    </div>
  )
}
