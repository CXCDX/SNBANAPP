import { useAppState, useAppDispatch } from '../store/AppContext'

const tabs = [
  { id: 'controls', label: 'Controls' },
  { id: 'preview', label: 'Preview' },
  { id: 'export', label: 'Export' },
]

export default function MobileTabBar() {
  const { activeTab } = useAppState()
  const dispatch = useAppDispatch()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-bg flex md:hidden"
      style={{ borderTop: '0.5px solid #E0E0DC' }}
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.id })}
          className={`flex-1 py-3 text-[11px] font-mono uppercase tracking-[0.15em] bg-transparent border-none cursor-pointer transition-all
            ${activeTab === tab.id ? 'text-ink' : 'text-secondary'}`}
          style={{
            borderTop: activeTab === tab.id ? '2px solid #0A0A0A' : '2px solid transparent',
          }}
          aria-label={tab.label}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
