import { createContext, useContext, useReducer } from 'react'

const AppContext = createContext(null)
const AppDispatchContext = createContext(null)

const DEFAULT_FONTS = [
  'Playfair Display',
  'DM Mono',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Helvetica',
  'Verdana',
]

const initialState = {
  // Image
  image: null,
  // Text content
  headline: '',
  tagline: '',
  subtext: '',
  ctaText: '',
  badge: '',
  // Per-field font + color
  headlineFont: 'Playfair Display',
  headlineColor: '',
  taglineFont: 'Playfair Display',
  taglineColor: '',
  subtextFont: 'DM Mono',
  subtextColor: '',
  ctaFont: 'DM Mono',
  ctaColor: '',
  // Brand
  logo: null,
  brandColor: '#00C4FF',
  // Badge library
  badgeLibrary: [],    // [{ id, name, src }]
  activeBadgeSrc: null,
  // Custom fonts
  customFonts: [],     // [{ name, src }]
  // UI
  selectedFormat: null,
  expandedFormat: null,
  toasts: [],
  isExporting: false,
  activeTab: 'controls',
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_IMAGE':
      return { ...state, image: action.payload }
    case 'CLEAR_IMAGE':
      return { ...state, image: null }
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
    // Per-field font + color
    case 'SET_FIELD_FONT':
      return { ...state, [`${action.payload.field}Font`]: action.payload.font }
    case 'SET_FIELD_COLOR':
      return { ...state, [`${action.payload.field}Color`]: action.payload.color }
    // Brand
    case 'SET_LOGO':
      return { ...state, logo: action.payload }
    case 'SET_BRAND_COLOR':
      return { ...state, brandColor: action.payload }
    // Badge library
    case 'ADD_BADGE_TO_LIBRARY':
      return { ...state, badgeLibrary: [...state.badgeLibrary, action.payload] }
    case 'REMOVE_BADGE_FROM_LIBRARY':
      return {
        ...state,
        badgeLibrary: state.badgeLibrary.filter(b => b.id !== action.payload),
        activeBadgeSrc: state.activeBadgeSrc && state.badgeLibrary.find(b => b.id === action.payload)?.src === state.activeBadgeSrc
          ? null
          : state.activeBadgeSrc,
      }
    case 'SET_ACTIVE_BADGE':
      return { ...state, activeBadgeSrc: action.payload }
    case 'CLEAR_ACTIVE_BADGE':
      return { ...state, activeBadgeSrc: null }
    // Custom fonts
    case 'ADD_CUSTOM_FONT':
      return { ...state, customFonts: [...state.customFonts, action.payload] }
    case 'REMOVE_CUSTOM_FONT':
      return { ...state, customFonts: state.customFonts.filter(f => f.name !== action.payload) }
    // UI
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
    default:
      return state
  }
}

export { DEFAULT_FONTS }

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
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
