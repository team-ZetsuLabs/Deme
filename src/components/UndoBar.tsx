import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Button from './Button'
import styles from './UndoBar.module.css'

export const UNDO_DELAY_MS = 6000

export type UndoBarProps = {
  message: string
  onUndo: () => void
  onExpire: () => void
}

export default function UndoBar({ message, onUndo, onExpire }: UndoBarProps) {
  const { t } = useTranslation()

  useEffect(() => {
    const id = setTimeout(onExpire, UNDO_DELAY_MS)
    return () => clearTimeout(id)
  }, [onExpire])

  return (
    <div className={styles.bar} role="status">
      <p className={styles.message}>{message}</p>
      <Button variant="primary" onClick={onUndo}>
        {t('common.undo')}
      </Button>
      <span className={styles.progress} style={{ animationDuration: `${UNDO_DELAY_MS}ms` }} />
    </div>
  )
}
