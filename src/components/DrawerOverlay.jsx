import { useAppState, useAppDispatch } from '../store/AppContext'

export default function DrawerOverlay({ children }) {
  const { drawerOpen } = useAppState()
  const dispatch = useAppDispatch()

  if (!drawerOpen) return null

  return (
    <div className="fixed inset-0 z-30 md:hidden" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        onClick={() => dispatch({ type: 'CLOSE_DRAWER' })}
        aria-label="Close drawer"
      />
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-surface border-r border-border overflow-y-auto animate-in slide-in-from-left">
        {children}
      </div>
    </div>
  )
}
