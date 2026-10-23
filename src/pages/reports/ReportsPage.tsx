import { useTranslation } from 'react-i18next'
import { PageHead } from '../../components/Panel'
import { useAdminStore } from '../../features/admin/AdminStore'
import ReportQueue from '../../features/reports/ReportQueue'
import { useCrumbs } from '../../layout/crumbs'

export default function ReportsPage() {
  const { t } = useTranslation()
  const { reports, settings } = useAdminStore()
  useCrumbs([
    { label: t('shell.groups.moderation'), to: '/signalements' },
    { label: t('nav.reports') },
  ])
  return (
    <>
      <PageHead
        title={t('nav.reports')}
        description={`${t('reports.pending', { count: reports.length })} ${t('reports.autoHideRule', { count: settings.autoHide })}`}
      />
      <ReportQueue actions={['ignore', 'hide', 'warn', 'suspend']} />
    </>
  )
}
