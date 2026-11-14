import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { adminApi, referentApi } from '../../api/endpoints'
import { errorMessage } from '../../api/errorMessage'
import type { CaseAction, ModerationCase, TargetType } from '../../api/types'
import { useQuery } from '../../api/useQuery'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import NoteDialog from '../../components/NoteDialog'
import { EmptyState, Filters, Panel } from '../../components/Panel'
import QueryState from '../../components/QueryState'
import Segmented from '../../components/Segmented'
import { Pill, Status } from '../../components/Status'
import { UNDO_DELAY_MS, useToast } from '../../components/ToastProvider'
import { useDeferredActions } from '../../hooks/useDeferredActions'
import { useCounts } from '../../layout/counts'
import { formatAgo, formatDateTime } from '../admin/format'
import styles from './ReportQueue.module.css'

const TARGETS: TargetType[] = ['QUESTION', 'ANSWER', 'JOB', 'MISSION', 'USER', 'PROJECT']
const NOTE_MIN = 10

export type ReportQueueProps = {
  /** « admin » : équipe (toutes les actions) ; « referent » : ignorer ou masquer seulement. */
  source: 'admin' | 'referent'
}

type Tab = 'OPEN' | 'APPEALED'
type NoteAction = Extract<CaseAction, 'HIDE' | 'WARN' | 'SUSPEND'>

export default function ReportQueue({ source }: ReportQueueProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const notify = useToast()
  const counts = useCounts()
  const [tab, setTab] = useState<Tab>('OPEN')
  const [target, setTarget] = useState<TargetType | 'all'>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [noting, setNoting] = useState<{ item: ModerationCase; action: NoteAction } | null>(null)
  const deferred = useDeferredActions(UNDO_DELAY_MS)

  const query = useQuery(
    (signal) => {
      const targetType = target === 'all' ? undefined : target
      return source === 'admin'
        ? adminApi.listCases({ status: tab, targetType, size: 50 }, { signal })
        : referentApi.listCases({ targetType, size: 50 }, { signal })
    },
    [source, tab, target],
  )

  const items = useMemo(
    () =>
      (query.data?.items ?? [])
        .filter((c) => !deferred.hidden.has(c.id))
        .sort((a, b) => b.reportCount - a.reportCount),
    [query.data, deferred.hidden],
  )
  const selected = items.find((c) => c.id === selectedId) ?? items[0]

  function decide(item: ModerationCase, action: CaseAction, note?: string) {
    const send = () =>
      source === 'admin'
        ? adminApi.decideCase(item.id, { action, note })
        : referentApi.decideCase(item.id, { action, note })
    deferred.schedule(item.id, send, (error) => {
      if (error) notify(errorMessage(t, error))
      else counts.refresh()
      query.reload()
    })
    setSelectedId(null)
    notify(t(`reports.toast.${action}`), () => deferred.cancel(item.id))
  }

  const tabOptions = [
    { value: 'OPEN' as Tab, label: t('reports.tab.OPEN') },
    { value: 'APPEALED' as Tab, label: t('reports.tab.APPEALED') },
  ]
  const targetOptions = [
    { value: 'all' as const, label: t('reports.allTypes') },
    ...TARGETS.map((x) => ({ value: x, label: t(`targets.${x}`) })),
  ]

  return (
    <>
      <Filters>
        {source === 'admin' && (
          <Segmented<Tab>
            label={t('reports.statusFilter')}
            options={tabOptions}
            value={tab}
            onChange={(next) => {
              setTab(next)
              setSelectedId(null)
            }}
          />
        )}
        <Segmented<TargetType | 'all'>
          label={t('reports.filterByType')}
          options={targetOptions}
          value={target}
          onChange={(next) => {
            setTarget(next)
            setSelectedId(null)
          }}
        />
      </Filters>
      <Panel>
        <QueryState
          query={query}
          isEmpty={() => items.length === 0}
          empty={<EmptyState title={t('reports.emptyTitle')}>{t('reports.emptyHint')}</EmptyState>}
        >
          {() =>
            selected && (
              <div className={styles.split}>
                <div className={styles.queue} role="list" aria-label={t('reports.queue')}>
                  {items.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="listitem"
                      className={styles.item}
                      aria-current={c.id === selected.id}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <span className={styles.top}>
                        <Pill>{t(`targets.${c.target.type}`)}</Pill>
                        <span className={styles.count}>
                          {t('reports.count', { count: c.reportCount })}
                        </span>
                        <span className={styles.ago}>{formatAgo(c.firstReportedAt, lang)}</span>
                      </span>
                      <p>{c.target.excerpt ?? c.target.title}</p>
                      <small>
                        {t('reports.reasonBy', {
                          reason: c.reasons.map((r) => t(`reasons.${r.reason}`)).join(', '),
                          name: c.target.author.displayName,
                        })}
                      </small>
                    </button>
                  ))}
                </div>
                <CaseDetail
                  item={selected}
                  source={source}
                  appealed={selected.status === 'APPEALED'}
                  onDecide={decide}
                  onNote={(action) => setNoting({ item: selected, action })}
                />
              </div>
            )
          }
        </QueryState>
      </Panel>

      <NoteDialog
        open={noting !== null}
        title={noting ? t(`reports.note.${noting.action}.title`) : ''}
        lead={
          noting
            ? t(`reports.note.${noting.action}.lead`, {
                name: noting.item.target.author.displayName,
              })
            : undefined
        }
        label={t('reports.note.label')}
        hint={t('reports.note.hint')}
        minLength={NOTE_MIN}
        initial={
          noting?.action === 'WARN'
            ? t('reports.note.template', {
                name: noting.item.target.author.displayName.split(' ')[0],
                type: t(`targets.${noting.item.target.type}`).toLowerCase(),
                reason: noting.item.reasons[0] ? t(`reasons.${noting.item.reasons[0].reason}`) : '',
              })
            : ''
        }
        submitLabel={noting ? t(`reports.action.${noting.action}`) : ''}
        danger={noting?.action === 'SUSPEND'}
        onClose={() => setNoting(null)}
        onSubmit={(note) => {
          if (!noting) return
          decide(noting.item, noting.action, note)
          setNoting(null)
        }}
      />
    </>
  )
}

function CaseDetail({
  item,
  source,
  appealed,
  onDecide,
  onNote,
}: {
  item: ModerationCase
  source: 'admin' | 'referent'
  appealed: boolean
  onDecide: (item: ModerationCase, action: CaseAction) => void
  onNote: (action: NoteAction) => void
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const author = item.target.author
  const mainReason = item.reasons[0]

  return (
    <div className={styles.detail} tabIndex={-1}>
      <div className={styles.titleRow}>
        <h2>
          {t(`reports.detailTitle.${item.target.type}`, {
            reason: mainReason ? t(`reasons.${mainReason.reason}`) : '',
          })}
        </h2>
        <span className={styles.count}>{t('reports.count', { count: item.reportCount })}</span>
        <Status tone={appealed ? 'warn' : 'neutral'}>{t(`caseStatus.${item.status}`)}</Status>
      </div>
      <div className={styles.quote}>
        <div className={styles.ctx}>{item.target.title}</div>
        {item.target.excerpt && <p>{item.target.excerpt}</p>}
      </div>
      <dl className={styles.dl}>
        <dt>{t('reports.author')}</dt>
        <dd>
          <Link
            className={styles.who}
            to={`/utilisateurs?q=${encodeURIComponent(author.username)}`}
          >
            <Avatar name={author.displayName} size={26} />
            <b>{author.deleted ? t('reports.deletedUser') : author.displayName}</b>
          </Link>
        </dd>
        <dt>{t('reports.authorLevel')}</dt>
        <dd>
          {t(`levels.${author.level}`)}, {t('reports.points', { count: author.reputation })}
        </dd>
        {author.countryCode && (
          <>
            <dt>{t('reports.country')}</dt>
            <dd>{author.countryCode}</dd>
          </>
        )}
        <dt>{t('reports.firstReported')}</dt>
        <dd>{formatDateTime(item.firstReportedAt, lang)}</dd>
        {item.decision && (
          <>
            <dt>{t('reports.decision')}</dt>
            <dd>
              {t(`reports.toast.${item.decision.action}`)}{' '}
              {item.decision.byTeam ? t('reports.byTeam') : t('reports.byReferent')}
              {item.decision.note ? `, ${item.decision.note}` : ''}
            </dd>
          </>
        )}
        {item.appeal && (
          <>
            <dt>{t('reports.appeal')}</dt>
            <dd>{item.appeal}</dd>
          </>
        )}
      </dl>
      <h3 className={styles.sectionTitle}>{t('reports.reasonsTitle')}</h3>
      <ul className={styles.reporters}>
        {item.reasons.map((r) => (
          <li key={r.reason}>
            <span />
            <b style={{ fontWeight: 500 }}>{t(`reasons.${r.reason}`)}</b>
            <span>{t('reports.count', { count: r.count })}</span>
          </li>
        ))}
      </ul>
      {item.comments.length > 0 && (
        <>
          <h3 className={styles.sectionTitle}>{t('reports.comments')}</h3>
          <ul className={styles.reporters}>
            {item.comments.map((comment, i) => (
              <li key={i}>
                <span />
                <span style={{ color: 'var(--text)', fontSize: 14 }}>{comment}</span>
                <span />
              </li>
            ))}
          </ul>
        </>
      )}
      <div className={styles.actionBar}>
        {appealed ? (
          <>
            <Button variant="primary" onClick={() => onDecide(item, 'RESTORE')}>
              {t('reports.action.RESTORE')}
            </Button>
            <Button onClick={() => onNote('HIDE')}>{t('reports.action.KEEP')}</Button>
          </>
        ) : (
          <>
            <Button onClick={() => onDecide(item, 'DISMISS')}>{t('reports.action.DISMISS')}</Button>
            <Button onClick={() => onNote('HIDE')}>{t('reports.action.HIDE')}</Button>
            {source === 'admin' && (
              <>
                <Button onClick={() => onNote('WARN')}>{t('reports.action.WARN')}</Button>
                <Button variant="dangerLine" onClick={() => onNote('SUSPEND')}>
                  {t('reports.action.SUSPEND')}
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
