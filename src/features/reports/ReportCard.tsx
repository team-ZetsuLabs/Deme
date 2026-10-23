import { useTranslation } from 'react-i18next'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import ItemCard from '../../components/ItemCard'
import type { ReportAction, ReportItem, ReportStatus } from './types'

export type ReportCardProps = {
  report: ReportItem
  actions: ReportAction[]
  onAction: (report: ReportItem, action: ReportAction) => void
}

const STATUS_TONE: Record<ReportStatus, 'neutral' | 'warning' | 'danger'> = {
  pending: 'warning',
  ignored: 'neutral',
  hidden: 'danger',
  warned: 'warning',
  suspended: 'danger',
}

export default function ReportCard({ report, actions, onAction }: ReportCardProps) {
  const { t, i18n } = useTranslation()
  const date = new Date(report.reportedAt).toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <ItemCard
      leading={<Avatar name={report.author} />}
      title={report.author}
      meta={`${report.country} · ${date}`}
      badges={
        <>
          <Badge tone="info">{t(`reports.target.${report.target}`)}</Badge>
          <Badge tone="danger">{t(`reports.reason.${report.reason}`)}</Badge>
          <Badge>{t('reports.reportCount', { count: report.count })}</Badge>
          {report.status !== 'pending' && (
            <Badge tone={STATUS_TONE[report.status]}>{t(`reports.status.${report.status}`)}</Badge>
          )}
        </>
      }
      actions={
        report.status === 'pending' &&
        actions.map((action) => (
          <Button
            key={action}
            variant={action === 'suspend' ? 'danger' : 'secondary'}
            onClick={() => onAction(report, action)}
          >
            {t(`reports.action.${action}`)}
          </Button>
        ))
      }
    >
      <p>{report.excerpt}</p>
    </ItemCard>
  )
}
