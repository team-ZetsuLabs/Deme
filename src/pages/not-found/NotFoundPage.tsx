import { useTranslation } from 'react-i18next'
import { ButtonLink } from '../../components/Button'
import ErrorPanel from '../../components/ErrorPanel'
import { useCrumbs } from '../../layout/crumbs'

export default function NotFoundPage() {
  const { t } = useTranslation()
  useCrumbs([{ label: t('errors.notFound.title') }])
  return (
    <ErrorPanel
      title={t('errors.notFound.title')}
      message={t('errors.notFound.message')}
      actions={
        <ButtonLink variant="primary" to="/tableau-de-bord">
          {t('errors.backHome')}
        </ButtonLink>
      }
    />
  )
}
