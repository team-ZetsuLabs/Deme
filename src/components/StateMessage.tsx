import { useTranslation } from 'react-i18next'
import Button from './Button'
import styles from './StateMessage.module.css'

export type StateMessageProps = {
  kind: 'loading' | 'error' | 'empty'
  message?: string
  onRetry?: () => void
}

export default function StateMessage({ kind, message, onRetry }: StateMessageProps) {
  const { t } = useTranslation()
  const text = message ?? t(`common.${kind}`)
  return (
    <div
      className={`${styles.state} ${kind === 'error' ? styles.error : ''}`}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      <p>{text}</p>
      {kind === 'error' && onRetry && <Button onClick={onRetry}>{t('common.retry')}</Button>}
    </div>
  )
}
