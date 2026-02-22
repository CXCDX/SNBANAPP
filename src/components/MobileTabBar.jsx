import { useAppState, useAppDispatch } from '../store/AppContext'

const tabs = [
  { id: 'controls', label: 'Controls', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  )},
  { id: 'preview', label: 'Preview', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )},
  { id: 'export', label: 'Export', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )},
]

export default function MobileTabBar() {
  const { activeTab } = useAppState()
  const dispatch = useAppDispatch()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border flex md:hidden"
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.id })}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors
            ${activeTab === tab.id ? 'text-accent' : 'text-text-secondary'}`}
          aria-label={tab.label}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          {tab.icon}
          <span className="text-[10px] font-mono">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
