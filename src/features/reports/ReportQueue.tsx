import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Dialog from '../../components/Dialog'
import ItemCard from '../../components/ItemCard'
import ItemList from '../../components/ItemList'
import SegmentedControl from '../../components/SegmentedControl'
import type { SegmentedOption } from '../../components/SegmentedControl'
import StateMessage from '../../components/StateMessage'
import UndoBar from '../../components/UndoBar'
import { useSimulatedLoad } from '../../hooks/useSimulatedLoad'
import ReportCard from './ReportCard'
import { useReportQueue } from './useReportQueue'
import type { ReportAction, ReportItem } from './types'

export type ReportQueueProps = {
  actions: ReportAction[]
  withContests: boolean
}

type View = 'pending' | 'treated' | 'contests'

export default function ReportQueue({ actions, withContests }: ReportQueueProps) {
  const { t } = useTranslation()
  const loading = useSimulatedLoad()
  const queue = useReportQueue()
  const [view, setView] = useState<View>('pending')
  const [toSuspend, setToSuspend] = useState<ReportItem | null>(null)

  const pending = queue.reports.filter((r) => r.status === 'pending')
  const treated = queue.reports.filter((r) => r.status !== 'pending')
  const pendingContests = queue.contests.filter((c) => c.status === 'pending')

  function handleAction(report: ReportItem, action: ReportAction) {
    if (action === 'suspend') setToSuspend(report)
    else queue.applyReport(report, action)
  }

  const options: SegmentedOption<View>[] = [
    { value: 'pending', label: t('reports.tab.pending'), count: pending.length },
    { value: 'treated', label: t('reports.tab.treated'), count: treated.length },
    ...(withContests
      ? [
          {
            value: 'contests' as const,
            label: t('reports.tab.contests'),
            count: pendingContests.length,
          },
        ]
      : []),
  ]

  function renderReports(list: ReportItem[]) {
    if (list.length === 0) return <StateMessage kind="empty" message={t('reports.empty')} />
    return (
      <ItemList label={t('nav.reports')}>
        {list.map((report) => (
          <ReportCard key={report.id} report={report} actions={actions} onAction={handleAction} />
        ))}
      </ItemList>
    )
  }

  function renderContests() {
    if (queue.contests.length === 0) {
      return <StateMessage kind="empty" message={t('reports.contest.empty')} />
    }
    return (
      <ItemList label={t('reports.tab.contests')}>
        {queue.contests.map((contest) => (
          <ItemCard
            key={contest.id}
            leading={<Avatar name={contest.author} />}
            title={contest.author}
            meta={contest.country}
            badges={
              <>
                <Badge tone="info">{t(`reports.target.${contest.target}`)}</Badge>
                <Badge tone={contest.status === 'pending' ? 'warning' : 'neutral'}>
                  {t(`reports.contest.status.${contest.status}`)}
                </Badge>
              </>
            }
            actions={
              contest.status === 'pending' && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => queue.resolveContest(contest, 'restored')}
                  >
                    {t('reports.contest.restore')}
                  </Button>
                  <Button onClick={() => queue.resolveContest(contest, 'upheld')}>
                    {t('reports.contest.keep')}
                  </Button>
                </>
              )
            }
          >
            <p>{contest.excerpt}</p>
            <p>
              <strong>{t('reports.contest.authorMessage')}</strong> {contest.message}
            </p>
          </ItemCard>
        ))}
      </ItemList>
    )
  }

  return (
    <>
      <SegmentedControl
        label={t('reports.filter')}
        options={options}
        value={view}
        onChange={(next) => setView(next)}
      />
      {loading ? (
        <StateMessage kind="loading" />
      ) : view === 'pending' ? (
        renderReports(pending)
      ) : view === 'treated' ? (
        renderReports(treated)
      ) : (
        renderContests()
      )}

      <Dialog
        open={toSuspend !== null}
        title={t('reports.suspendDialog.title')}
        onClose={() => setToSuspend(null)}
        footer={
          <>
            <Button onClick={() => setToSuspend(null)}>{t('common.cancel')}</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (toSuspend) queue.applyReport(toSuspend, 'suspend')
                setToSuspend(null)
              }}
            >
              {t('reports.action.suspend')}
            </Button>
          </>
        }
      >
        <p>{t('reports.suspendDialog.body', { author: toSuspend?.author })}</p>
      </Dialog>

      {queue.undo && (
        <UndoBar
          key={`${queue.undo.kind}-${queue.undo.id}-${queue.undo.label}`}
          message={t('reports.undoMessage')}
          onUndo={queue.undoLast}
          onExpire={queue.clearUndo}
        />
      )}
    </>
  )
}
