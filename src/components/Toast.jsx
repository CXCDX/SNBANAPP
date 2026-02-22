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

  const bgColor = toast.variant === 'error'
    ? 'bg-danger'
    : toast.variant === 'success'
      ? 'bg-green-600'
      : 'bg-surface'

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`${bgColor} border border-border rounded-lg px-4 py-3 text-sm text-text-primary shadow-lg ${exiting ? 'toast-exit' : 'toast-enter'}`}
    >
      {toast.message}
    </div>
  )
}

export default function ToastContainer() {
  const { toasts } = useAppState()

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2" aria-label="Notifications">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
