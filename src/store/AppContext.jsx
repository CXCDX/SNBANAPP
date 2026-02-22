import { createContext, useContext, useReducer } from 'react'

const AppContext = createContext(null)
const AppDispatchContext = createContext(null)

const initialState = {
  // Image
  image: null,        // { src: dataURL, name, width, height, luminance }
  // Text
  headline: '',
  subtext: '',
  ctaText: '',
  badge: '',
  // Brand
  logo: null,         // dataURL
  brandColor: '#00C4FF',
  // UI
  selectedFormat: null,
  expandedFormat: null,
  toasts: [],
  isExporting: false,
  // Mobile
  activeTab: 'controls',
  drawerOpen: false,
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_IMAGE':
      return { ...state, image: action.payload }
    case 'CLEAR_IMAGE':
      return { ...state, image: null }
    case 'SET_HEADLINE':
      return { ...state, headline: action.payload.slice(0, 30) }
    case 'SET_SUBTEXT':
      return { ...state, subtext: action.payload.slice(0, 90) }
    case 'SET_CTA':
      return { ...state, ctaText: action.payload }
    case 'SET_BADGE':
      return { ...state, badge: action.payload }
    case 'SET_LOGO':
      return { ...state, logo: action.payload }
    case 'SET_BRAND_COLOR':
      return { ...state, brandColor: action.payload }
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
    case 'TOGGLE_DRAWER':
      return { ...state, drawerOpen: !state.drawerOpen }
    case 'CLOSE_DRAWER':
      return { ...state, drawerOpen: false }
    default:
      return state
  }
}

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
