import { useEffect, useState } from 'react'
import { useAppState, useAppDispatch } from '../store/AppContext'

function ToastItem({ toast }) {
  const dispatch = useAppDispatch()
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id }), 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [toast.id, dispatch])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`bg-bg px-5 py-3 text-[11px] font-mono text-ink ${exiting ? 'toast-exit' : 'toast-enter'}`}
      style={{ borderLeft: toast.variant === 'error' ? '2px solid #FF3D57' : '2px solid #0A0A0A' }}
    >
      {toast.message}
    </div>
  )
}

export default function ToastContainer() {
  const { toasts } = useAppState()

  return (
    <div className="fixed bottom-6 left-16 z-50 flex flex-col gap-2" aria-label="Notifications">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
