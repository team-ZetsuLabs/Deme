import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import ErrorPanel from '../../components/ErrorPanel'

export default function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <ErrorPanel
      title={t('errors.notFound.title')}
      message={t('errors.notFound.message')}
      actions={<Link to="/reports">{t('errors.backHome')}</Link>}
    />
  )
}
