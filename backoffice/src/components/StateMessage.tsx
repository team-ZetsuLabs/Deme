import { useTranslation } from 'react-i18next'
import Button from './Button'
import { EmptyState } from './Panel'

export type StateMessageProps = {
  kind: 'loading' | 'error' | 'empty'
  message?: string
  onRetry?: () => void
}

export default function StateMessage({ kind, message, onRetry }: StateMessageProps) {
  const { t } = useTranslation()
  const text = message ?? t(`common.${kind}`)
  return (
    <div role={kind === 'error' ? 'alert' : 'status'}>
      <EmptyState title={text}>
        {kind === 'error' && onRetry && (
          <Button style={{ marginTop: 12 }} onClick={onRetry}>
            {t('common.retry')}
          </Button>
        )}
      </EmptyState>
    </div>
  )
}
