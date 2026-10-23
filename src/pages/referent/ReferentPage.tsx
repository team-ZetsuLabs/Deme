import { useTranslation } from 'react-i18next'
import { PageHead } from '../../components/Panel'
import ReportQueue from '../../features/reports/ReportQueue'
import { useCrumbs } from '../../layout/crumbs'

export default function ReferentPage() {
  const { t } = useTranslation()
  useCrumbs([
    { label: t('shell.groups.moderation'), to: '/signalements' },
    { label: t('nav.referent') },
  ])
  return (
    <>
      <PageHead title={t('nav.referent')} description={t('referent.intro')} />
      <ReportQueue actions={['ignore', 'hide']} />
    </>
  )
}
