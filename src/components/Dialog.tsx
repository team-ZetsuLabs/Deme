import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Button from './Button'
import Icon from './Icon'
import styles from './Dialog.module.css'

export type DialogProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export default function Dialog({ open, title, onClose, children }: DialogProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      if (typeof el.showModal === 'function') el.showModal()
      else el.setAttribute('open', '')
    }
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      {open && (
        <>
          <div className={styles.head}>
            <h2 id={titleId}>{title}</h2>
            <Button variant="ghost" size="icon" aria-label={t('common.close')} onClick={onClose}>
              <Icon name="x" size={14} />
            </Button>
          </div>
          {children}
        </>
      )}
    </dialog>
  )
}

export function DialogBody({
  children,
  onSubmit,
}: {
  children: ReactNode
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return onSubmit ? (
    <form className={styles.body} onSubmit={onSubmit} noValidate>
      {children}
    </form>
  ) : (
    <div className={styles.body}>{children}</div>
  )
}

export function DialogLead({ children }: { children: ReactNode }) {
  return <p className={styles.lead}>{children}</p>
}

export function DialogFoot({ children }: { children: ReactNode }) {
  return <div className={styles.foot}>{children}</div>
}
