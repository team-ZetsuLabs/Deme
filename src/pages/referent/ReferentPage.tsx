import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader'
import ReportQueue from '../../features/reports/ReportQueue'

export default function ReferentPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('referent.title')} description={t('referent.intro')} />
      <ReportQueue actions={['ignore', 'hide']} withContests={false} />
    </>
  )
}
