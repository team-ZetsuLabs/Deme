import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Toast.module.css'

export const UNDO_DELAY_MS = 6000
const MESSAGE_DELAY_MS = 2800

type ToastState = { message: string; undo?: () => void }
type Notify = (message: string, undo?: () => void) => void

const ToastContext = createContext<Notify | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const notify = useCallback<Notify>((message, undo) => {
    clearTimeout(timer.current)
    setToast({ message, undo })
    timer.current = setTimeout(() => setToast(null), undo ? UNDO_DELAY_MS : MESSAGE_DELAY_MS)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])
  const value = useMemo(() => notify, [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={`${styles.toast} ${toast ? styles.show : ''}`}
        role="status"
        aria-live="polite"
      >
        <span>{toast?.message}</span>
        {toast?.undo && (
          <button
            type="button"
            onClick={() => {
              toast.undo?.()
              clearTimeout(timer.current)
              setToast(null)
            }}
          >
            {t('common.undo')}
          </button>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): Notify {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être utilisé dans ToastProvider')
  return ctx
}
