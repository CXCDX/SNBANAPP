import { createContext, useContext, useReducer, useEffect } from 'react'

const AppContext = createContext(null)
const AppDispatchContext = createContext(null)

const DEFAULT_FONTS = [
  'Playfair Display',
  'Barlow Condensed',
  'DM Sans',
  'DM Mono',
]

const MAX_HISTORY = 20

function loadPersisted() {
  try {
    const raw = localStorage.getItem('bannerStudioSettings')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

const persisted = loadPersisted()

const initialState = {
  // Image
  image: null,
  focusPoints: {},
  // Text content
  headline: '',
  tagline: '',
  subtext: '',
  ctaText: '',
  badge: '',
  // Per-field font + color + size
  headlineFont: persisted.headlineFont || 'Barlow Condensed',
  headlineColor: persisted.headlineColor || '',
  headlineSize: persisted.headlineSize || 72,
  taglineFont: persisted.taglineFont || 'Playfair Display',
  taglineColor: persisted.taglineColor || '',
  taglineSize: persisted.taglineSize || 36,
  subtextFont: persisted.subtextFont || 'DM Sans',
  subtextColor: persisted.subtextColor || '',
  subtextSize: persisted.subtextSize || 18,
  ctaFont: persisted.ctaFont || 'DM Sans',
  ctaColor: persisted.ctaColor || '',
  ctaSize: persisted.ctaSize || 14,
  // Logo
  logo: null,
  logoType: persisted.logoType || 'custom',
  logoPosition: persisted.logoPosition || 'top-left',
  logoSize: persisted.logoSize || 40,
  brandColor: persisted.brandColor || '#00C4FF',
  // Badge library
  badgeLibrary: [],
  activeBadgeSrc: null,
  badgePosition: persisted.badgePosition || 'top-right',
  badgeSize: persisted.badgeSize || 60,
  // Badge designer
  badgeEnabled: persisted.badgeEnabled ?? false,
  badgeShape: persisted.badgeShape || 'circle',
  badgeBgColor: persisted.badgeBgColor || '#FF3D57',
  badgeTextColor: persisted.badgeTextColor || '#FFFFFF',
  badgeBorderColor: persisted.badgeBorderColor || '#FFFFFF',
  badgeBorderWidth: persisted.badgeBorderWidth ?? 0,
  badgeFontFamily: persisted.badgeFontFamily || 'Barlow Condensed',
  badgeFontSize: persisted.badgeFontSize || 12,
  badgeBold: persisted.badgeBold ?? true,
  badgeItalic: persisted.badgeItalic ?? false,
  badgeTextAlign: persisted.badgeTextAlign || 'center',
  badgeLine1: persisted.badgeLine1 || '',
  badgeLine2: persisted.badgeLine2 || '',
  badgeLine3: persisted.badgeLine3 || '',
  badgeRotation: persisted.badgeRotation ?? 0,
  // Custom fonts
  customFonts: [],
  // CSV
  csvData: null,
  csvFileName: '',
  // Inline editor
  editingFormat: null,
  textPositions: {},
  // Export
  exportQuality: persisted.exportQuality || 0.8,
  // Design police
  designIssues: [],
  showDesignPolice: false,
  showExportModal: false,
  // UI
  selectedFormat: null,
  expandedFormat: null,
  toasts: [],
  isExporting: false,
  exportProgress: null,
  exportCancelled: false,
  activeTab: 'controls',
  // Undo/Redo
  history: [],
  historyIndex: -1,
}

const UNDOABLE_ACTIONS = new Set([
  'SET_IMAGE', 'CLEAR_IMAGE', 'SET_FORMAT_FOCUS_POINT',
  'SET_HEADLINE', 'SET_TAGLINE', 'SET_SUBTEXT', 'SET_CTA', 'SET_BADGE',
  'SET_FIELD_FONT', 'SET_FIELD_COLOR', 'SET_FIELD_SIZE',
  'SET_LOGO', 'SET_LOGO_TYPE', 'SET_LOGO_POSITION', 'SET_LOGO_SIZE',
  'SET_BRAND_COLOR', 'SET_ACTIVE_BADGE', 'CLEAR_ACTIVE_BADGE', 'SET_BADGE_POSITION', 'SET_BADGE_SIZE',
  'SET_BADGE_ENABLED',
  'SET_BADGE_SHAPE', 'SET_BADGE_BG_COLOR', 'SET_BADGE_TEXT_COLOR', 'SET_BADGE_BORDER_COLOR',
  'SET_BADGE_BORDER_WIDTH', 'SET_BADGE_FONT_FAMILY', 'SET_BADGE_FONT_SIZE', 'SET_BADGE_BOLD',
  'SET_BADGE_ITALIC', 'SET_BADGE_TEXT_ALIGN', 'SET_BADGE_LINE1', 'SET_BADGE_LINE2', 'SET_BADGE_LINE3',
  'SET_BADGE_ROTATION',
  'SET_TEXT_POSITION',
])

const PERSIST_KEYS = [
  'headlineFont', 'headlineColor', 'headlineSize',
  'taglineFont', 'taglineColor', 'taglineSize',
  'subtextFont', 'subtextColor', 'subtextSize',
  'ctaFont', 'ctaColor', 'ctaSize',
  'logoType', 'logoPosition', 'logoSize', 'brandColor',
  'badgePosition', 'badgeSize',
  'badgeEnabled',
  'badgeShape', 'badgeBgColor', 'badgeTextColor', 'badgeBorderColor', 'badgeBorderWidth',
  'badgeFontFamily', 'badgeFontSize', 'badgeBold', 'badgeItalic', 'badgeTextAlign',
  'badgeLine1', 'badgeLine2', 'badgeLine3', 'badgeRotation',
  'exportQuality',
]

function pushHistory(state) {
  const { history, historyIndex, toasts, isExporting, exportProgress, exportCancelled, showDesignPolice, designIssues, ...snap } = state
  const past = history.slice(0, historyIndex + 1)
  const newHistory = [...past, snap].slice(-MAX_HISTORY)
  return { history: newHistory, historyIndex: newHistory.length - 1 }
}

function appReducer(state, action) {
  if (action.type === 'UNDO') {
    if (state.historyIndex <= 0) return state
    const newIndex = state.historyIndex - 1
    const snap = state.history[newIndex]
    return { ...state, ...snap, history: state.history, historyIndex: newIndex }
  }

  if (action.type === 'REDO') {
    if (state.historyIndex >= state.history.length - 1) return state
    const newIndex = state.historyIndex + 1
    const snap = state.history[newIndex]
    return { ...state, ...snap, history: state.history, historyIndex: newIndex }
  }

  let newState = coreReducer(state, action)

  if (UNDOABLE_ACTIONS.has(action.type) && newState !== state) {
    const historyUpdate = pushHistory(state)
    newState = { ...newState, ...historyUpdate }
  }

  return newState
}

function coreReducer(state, action) {
  switch (action.type) {
    case 'SET_IMAGE':
      return { ...state, image: action.payload }
    case 'CLEAR_IMAGE':
      return { ...state, image: null, focusPoints: {} }
    case 'INIT_FOCUS_POINTS': {
      const pts = {}
      action.payload.forEach(key => { pts[key] = { x: 0.5, y: 0.5 } })
      return { ...state, focusPoints: pts }
    }
    case 'SET_FORMAT_FOCUS_POINT':
      return {
        ...state,
        focusPoints: { ...state.focusPoints, [action.payload.formatKey]: action.payload.point },
      }
    case 'SET_HEADLINE':
      return { ...state, headline: action.payload.slice(0, 30) }
    case 'SET_TAGLINE':
      return { ...state, tagline: action.payload }
    case 'SET_SUBTEXT':
      return { ...state, subtext: action.payload.slice(0, 90) }
    case 'SET_CTA':
      return { ...state, ctaText: action.payload }
    case 'SET_BADGE':
      return { ...state, badge: action.payload }
    case 'SET_FIELD_FONT':
      return { ...state, [`${action.payload.field}Font`]: action.payload.font }
    case 'SET_FIELD_COLOR':
      return { ...state, [`${action.payload.field}Color`]: action.payload.color }
    case 'SET_FIELD_SIZE':
      return { ...state, [`${action.payload.field}Size`]: action.payload.size }
    case 'SET_LOGO':
      return { ...state, logo: action.payload }
    case 'SET_LOGO_TYPE':
      return { ...state, logoType: action.payload }
    case 'SET_LOGO_POSITION':
      return { ...state, logoPosition: action.payload }
    case 'SET_LOGO_SIZE':
      return { ...state, logoSize: action.payload }
    case 'SET_BRAND_COLOR':
      return { ...state, brandColor: action.payload }
    case 'ADD_BADGE_TO_LIBRARY':
      return { ...state, badgeLibrary: [...state.badgeLibrary, action.payload] }
    case 'REMOVE_BADGE_FROM_LIBRARY':
      return {
        ...state,
        badgeLibrary: state.badgeLibrary.filter(b => b.id !== action.payload),
        activeBadgeSrc: state.activeBadgeSrc && state.badgeLibrary.find(b => b.id === action.payload)?.src === state.activeBadgeSrc
          ? null : state.activeBadgeSrc,
      }
    case 'SET_BADGE_LIBRARY':
      return { ...state, badgeLibrary: action.payload }
    case 'SET_ACTIVE_BADGE':
      return { ...state, activeBadgeSrc: action.payload }
    case 'CLEAR_ACTIVE_BADGE':
      return { ...state, activeBadgeSrc: null }
    case 'SET_BADGE_POSITION':
      return { ...state, badgePosition: action.payload }
    case 'SET_BADGE_SIZE':
      return { ...state, badgeSize: action.payload }
    case 'SET_BADGE_ENABLED':
      return { ...state, badgeEnabled: action.payload }
    case 'SET_BADGE_SHAPE':
      return { ...state, badgeShape: action.payload }
    case 'SET_BADGE_BG_COLOR':
      return { ...state, badgeBgColor: action.payload }
    case 'SET_BADGE_TEXT_COLOR':
      return { ...state, badgeTextColor: action.payload }
    case 'SET_BADGE_BORDER_COLOR':
      return { ...state, badgeBorderColor: action.payload }
    case 'SET_BADGE_BORDER_WIDTH':
      return { ...state, badgeBorderWidth: action.payload }
    case 'SET_BADGE_FONT_FAMILY':
      return { ...state, badgeFontFamily: action.payload }
    case 'SET_BADGE_FONT_SIZE':
      return { ...state, badgeFontSize: action.payload }
    case 'SET_BADGE_BOLD':
      return { ...state, badgeBold: action.payload }
    case 'SET_BADGE_ITALIC':
      return { ...state, badgeItalic: action.payload }
    case 'SET_BADGE_TEXT_ALIGN':
      return { ...state, badgeTextAlign: action.payload }
    case 'SET_BADGE_LINE1': {
      const v = action.payload.slice(0, 20)
      return { ...state, badgeLine1: v, badgeEnabled: v ? true : state.badgeEnabled }
    }
    case 'SET_BADGE_LINE2': {
      const v = action.payload.slice(0, 20)
      return { ...state, badgeLine2: v, badgeEnabled: v ? true : state.badgeEnabled }
    }
    case 'SET_BADGE_LINE3': {
      const v = action.payload.slice(0, 20)
      return { ...state, badgeLine3: v, badgeEnabled: v ? true : state.badgeEnabled }
    }
    case 'SET_BADGE_ROTATION':
      return { ...state, badgeRotation: action.payload }
    case 'ADD_CUSTOM_FONT':
      return { ...state, customFonts: [...state.customFonts, action.payload] }
    case 'REMOVE_CUSTOM_FONT':
      return { ...state, customFonts: state.customFonts.filter(f => f.name !== action.payload) }
    case 'SET_CUSTOM_FONTS':
      return { ...state, customFonts: action.payload }
    case 'SET_CSV_DATA':
      return { ...state, csvData: action.payload.rows, csvFileName: action.payload.fileName }
    case 'CLEAR_CSV_DATA':
      return { ...state, csvData: null, csvFileName: '' }
    case 'SET_EDITING_FORMAT':
      return { ...state, editingFormat: action.payload }
    case 'SET_TEXT_POSITION':
      return {
        ...state,
        textPositions: { ...state.textPositions, [action.payload.field]: action.payload.position },
      }
    case 'CLEAR_TEXT_POSITIONS':
      return { ...state, textPositions: {} }
    case 'SET_EXPORT_QUALITY':
      return { ...state, exportQuality: action.payload }
    case 'SET_EXPORT_PROGRESS':
      return { ...state, exportProgress: action.payload }
    case 'SET_EXPORT_CANCELLED':
      return { ...state, exportCancelled: action.payload }
    case 'SET_DESIGN_ISSUES':
      return { ...state, designIssues: action.payload }
    case 'SET_SHOW_DESIGN_POLICE':
      return { ...state, showDesignPolice: action.payload }
    case 'SET_SHOW_EXPORT_MODAL':
      return { ...state, showExportModal: action.payload }
    case 'SET_SELECTED_FORMAT':
      return { ...state, selectedFormat: action.payload }
    case 'SET_EXPANDED_FORMAT':
      return { ...state, expandedFormat: action.payload }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, { id: Date.now(), ...action.payload }] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) }
    case 'SET_EXPORTING':
      return { ...state, isExporting: action.payload }
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload }
    case 'RESTORE_STATE':
      return { ...state, ...action.payload }
    default:
      return state
  }
}

export { DEFAULT_FONTS }

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Persist settings to localStorage
  useEffect(() => {
    const settings = {}
    PERSIST_KEYS.forEach(key => { settings[key] = state[key] })
    localStorage.setItem('bannerStudioSettings', JSON.stringify(settings))
  }, [state.headlineFont, state.headlineColor, state.headlineSize,
      state.taglineFont, state.taglineColor, state.taglineSize,
      state.subtextFont, state.subtextColor, state.subtextSize,
      state.ctaFont, state.ctaColor, state.ctaSize,
      state.logoType, state.logoPosition, state.logoSize, state.brandColor,
      state.badgePosition, state.badgeSize, state.badgeEnabled,
      state.badgeShape, state.badgeBgColor, state.badgeTextColor, state.badgeBorderColor,
      state.badgeBorderWidth, state.badgeFontFamily, state.badgeFontSize, state.badgeBold,
      state.badgeItalic, state.badgeTextAlign, state.badgeLine1, state.badgeLine2, state.badgeLine3,
      state.badgeRotation, state.exportQuality])

  // Undo/Redo keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        dispatch({ type: e.shiftKey ? 'REDO' : 'UNDO' })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <AppContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (ctx === null) throw new Error('useAppState must be used within AppProvider')
  return ctx
}

export function useAppDispatch() {
  const ctx = useContext(AppDispatchContext)
  if (ctx === null) throw new Error('useAppDispatch must be used within AppProvider')
  return ctx
}
