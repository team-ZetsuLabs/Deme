import { useTranslation } from 'react-i18next'
import { PageHead } from '../../components/Panel'
import ReportQueue from '../../features/reports/ReportQueue'
import { useCrumbs } from '../../layout/crumbs'

export default function ReportsPage() {
  const { t } = useTranslation()
  useCrumbs([
    { label: t('shell.groups.moderation'), to: '/signalements' },
    { label: t('nav.reports') },
  ])
  return (
    <>
      <PageHead title={t('nav.reports')} description={t('reports.lead')} />
      <ReportQueue source="admin" />
    </>
  )
}
