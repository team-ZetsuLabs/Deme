import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader'
import ReportQueue from '../../features/reports/ReportQueue'

export default function ReportsPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('reports.title')} description={t('reports.intro')} />
      <ReportQueue actions={['ignore', 'hide', 'warn', 'suspend']} withContests />
    </>
  )
}
