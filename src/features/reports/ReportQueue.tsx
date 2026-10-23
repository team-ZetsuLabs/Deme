import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import Dialog, { DialogBody, DialogFoot, DialogLead } from '../../components/Dialog'
import Field, { Toggle, SwitchRow } from '../../components/Field'
import { EmptyState, Filters, Panel } from '../../components/Panel'
import Segmented from '../../components/Segmented'
import { Pill, Status } from '../../components/Status'
import { useToast } from '../../components/ToastProvider'
import { useAdminStore } from '../admin/AdminStore'
import type { ReportOutcome } from '../admin/AdminStore'
import { daysAgoToTime, formatAgo, formatDate } from '../admin/format'
import SuspendDialog from '../admin/SuspendDialog'
import type { Duration } from '../admin/SuspendDialog'
import type { Report, ReportReason, User, UserStatus } from '../admin/types'
import styles from './ReportQueue.module.css'

export type ModAction = 'ignore' | 'hide' | 'warn' | 'suspend'

const REASONS: ReportReason[] = [
  'spam',
  'offensive',
  'offTopic',
  'impersonation',
  'fraudulentOffer',
]
const MIN_WARNING = 20
const STATUS_TONE: Record<UserStatus, 'good' | 'warn' | 'crit'> = {
  active: 'good',
  flagged: 'warn',
  suspended: 'crit',
}

export type ReportQueueProps = { actions: ModAction[] }

export default function ReportQueue({ actions }: ReportQueueProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const store = useAdminStore()
  const notify = useToast()
  const [params] = useSearchParams()
  const [reason, setReason] = useState<ReportReason | 'all'>('all')
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const open = Number(params.get('open'))
    return Number.isFinite(open) && open > 0 ? open : null
  })
  const [warning, setWarning] = useState<{ report: Report; author: User } | null>(null)
  const [suspending, setSuspending] = useState<{ report: Report; author: User } | null>(null)
  const queueRef = useRef<HTMLDivElement>(null)
  const focusNext = useRef(false)

  const list = useMemo(
    () =>
      store.reports
        .filter((r) => reason === 'all' || r.reason === reason)
        .sort((a, b) => b.count - a.count),
    [store.reports, reason],
  )
  const selected = list.find((r) => r.id === selectedId) ?? list[0]
  const author = selected ? store.userBy(selected.author) : undefined

  useEffect(() => {
    if (focusNext.current) {
      focusNext.current = false
      queueRef.current?.querySelector<HTMLElement>('button')?.focus()
    }
  })

  function resolve(
    report: Report,
    outcome: ReportOutcome,
    detail?: Parameters<typeof store.resolveReport>[2],
  ) {
    const undo = store.resolveReport(report.id, outcome, detail)
    const remaining = store.reports.length - 1
    setSelectedId(null)
    focusNext.current = true
    notify(
      `${t(`reports.toast.${outcome}`)} ${remaining > 0 ? t('reports.remaining', { count: remaining }) : t('reports.queueEmpty')}`,
      () => {
        undo()
        setSelectedId(report.id)
      },
    )
  }

  function submitWarning(hide: boolean) {
    if (!warning) return
    const { report, author: warned } = warning
    setWarning(null)
    resolve(report, 'warningSent', {
      key: hide ? 'warnedAndHidden' : 'warned',
      params: { name: warned.name },
    })
  }

  function confirmSuspension(user: User, duration: Duration, why: string) {
    if (!suspending) return
    const { report } = suspending
    store.suspendUsers([user.id], duration, why)
    setSuspending(null)
    resolve(report, 'accountSuspended', {
      key: 'suspendedFor',
      params: { name: user.name, duration: `t:users.durations.${duration}` },
    })
  }

  const options = [
    { value: 'all' as const, label: t('reports.allReasons'), count: store.reports.length },
    ...REASONS.map((r) => ({
      value: r,
      label: t(`reports.reason.${r}`),
      count: store.reports.filter((x) => x.reason === r).length,
    })),
  ]

  return (
    <>
      <Filters>
        <Segmented<ReportReason | 'all'>
          label={t('reports.filterByReason')}
          options={options}
          value={reason}
          onChange={(next) => {
            setReason(next)
            setSelectedId(null)
          }}
        />
      </Filters>
      <Panel>
        {selected && author ? (
          <div className={styles.split}>
            <div
              className={styles.queue}
              role="list"
              aria-label={t('reports.queue')}
              ref={queueRef}
            >
              {list.map((r) => {
                const rAuthor = store.userBy(r.author)
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="listitem"
                    className={styles.item}
                    aria-current={r.id === selected.id}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <span className={styles.top}>
                      <Pill>{t(`reports.types.${r.type}`)}</Pill>
                      <span className={styles.count}>{t('reports.count', { count: r.count })}</span>
                      <span className={styles.ago}>{formatAgo(r.at, lang)}</span>
                    </span>
                    <p>{r.content}</p>
                    <small>
                      {t('reports.reasonBy', {
                        reason: t(`reports.reason.${r.reason}`),
                        name: rAuthor?.name ?? r.author,
                      })}
                    </small>
                  </button>
                )
              })}
            </div>
            <div className={styles.detail} tabIndex={-1}>
              <div className={styles.titleRow}>
                <h2>
                  {t(`reports.detailTitle.${selected.type}`, {
                    reason: t(`reports.reason.${selected.reason}`),
                  })}
                </h2>
                <span className={styles.count}>
                  {t('reports.count', { count: selected.count })}
                </span>
              </div>
              <div className={styles.quote}>
                <div className={styles.ctx}>
                  {t(`reports.context.${selected.context.kind}`, {
                    title: 'title' in selected.context ? selected.context.title : '',
                    tag: 'tag' in selected.context ? selected.context.tag : '',
                  })}
                </div>
                <p>{selected.content}</p>
              </div>
              <dl className={styles.dl}>
                <dt>{t('reports.author')}</dt>
                <dd>
                  <Link className={styles.who} to={`/utilisateurs/${author.id}`}>
                    <Avatar name={author.name} size={26} />
                    <b>{author.name}</b>
                  </Link>
                </dd>
                <dt>{t('reports.accountStatus')}</dt>
                <dd>
                  <Status tone={STATUS_TONE[author.status]}>
                    {t(`users.status.${author.status}`)}
                  </Status>
                </dd>
                <dt>{t('reports.history')}</dt>
                <dd>
                  {author.warnings
                    ? t('users.warnings', { count: author.warnings })
                    : t('reports.noWarning')}
                  , {t('users.points', { count: author.rep })}
                </dd>
                <dt>{t('reports.joined')}</dt>
                <dd>
                  {formatDate(daysAgoToTime(author.joinedDays), lang, {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </dd>
              </dl>
              <h3 className={styles.sectionTitle}>{t('reports.reportedBy')}</h3>
              <ul className={styles.reporters}>
                {selected.reporters.map((id) => {
                  const reporter = store.userBy(id)
                  return (
                    <li key={id}>
                      <Avatar name={reporter?.name ?? id} size={26} />
                      <Link to={`/utilisateurs/${id}`}>{reporter?.name ?? id}</Link>
                      <span>{t(`reports.reason.${selected.reason}`)}</span>
                    </li>
                  )
                })}
              </ul>
              <div className={styles.actionBar}>
                {actions.includes('ignore') && (
                  <Button
                    onClick={() => resolve(selected, 'reportIgnored', { key: 'contentCompliant' })}
                  >
                    {t('reports.action.ignore')}
                  </Button>
                )}
                {actions.includes('hide') && (
                  <Button
                    onClick={() =>
                      resolve(selected, 'contentHidden', {
                        key: 'reasonIs',
                        params: { reason: `t:reports.reason.${selected.reason}` },
                      })
                    }
                  >
                    {t('reports.action.hide')}
                  </Button>
                )}
                {actions.includes('warn') && (
                  <Button onClick={() => setWarning({ report: selected, author })}>
                    {t('reports.action.warn')}
                  </Button>
                )}
                {actions.includes('suspend') && (
                  <Button
                    variant="dangerLine"
                    disabled={author.status === 'suspended'}
                    onClick={() => setSuspending({ report: selected, author })}
                  >
                    {t('reports.action.suspend')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title={
              reason === 'all'
                ? t('reports.emptyAll')
                : t('reports.emptyReason', { reason: t(`reports.reason.${reason}`) })
            }
          >
            {reason === 'all' ? (
              t('reports.emptyAllHint')
            ) : (
              <div style={{ marginTop: 12 }}>
                <Button onClick={() => setReason('all')}>{t('reports.allReasons')}</Button>
              </div>
            )}
          </EmptyState>
        )}
      </Panel>

      <WarnDialog target={warning} onClose={() => setWarning(null)} onSubmit={submitWarning} />
      <SuspendDialog
        user={suspending?.author ?? null}
        onClose={() => setSuspending(null)}
        onConfirm={confirmSuspension}
      />
    </>
  )
}

function WarnDialog({
  target,
  onClose,
  onSubmit,
}: {
  target: { report: Report; author: User } | null
  onClose: () => void
  onSubmit: (hide: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={target !== null} title={t('reports.warn.title')} onClose={onClose}>
      {target && <WarnForm target={target} onClose={onClose} onSubmit={onSubmit} />}
    </Dialog>
  )
}

/** Monté à l'ouverture de la fenêtre seulement : le message modèle est recalculé à chaque fois. */
function WarnForm({
  target,
  onClose,
  onSubmit,
}: {
  target: { report: Report; author: User }
  onClose: () => void
  onSubmit: (hide: boolean) => void
}) {
  const { t } = useTranslation()
  const [message, setMessage] = useState(() =>
    t('reports.warn.template', {
      name: target.author.name.split(' ')[0],
      type: t(`reports.types.${target.report.type}`).toLowerCase(),
      reason: t(`reports.reason.${target.report.reason}`),
    }),
  )
  const [hide, setHide] = useState(true)
  const [touched, setTouched] = useState(false)

  const error =
    touched && message.trim().length < MIN_WARNING
      ? t('reports.warn.error', { count: MIN_WARNING })
      : undefined

  function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (message.trim().length < MIN_WARNING) return
    onSubmit(hide)
  }

  return (
    <DialogBody onSubmit={submit}>
      <DialogLead>{t('reports.warn.lead', { name: target.author.name })}</DialogLead>
      <Field label={t('reports.warn.message')} error={error}>
        {(control) => (
          <textarea
            {...control}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        )}
      </Field>
      <SwitchRow title={t('reports.warn.hideToo')} description={t('reports.warn.hideHint')}>
        <Toggle label={t('reports.warn.hideToo')} checked={hide} onChange={setHide} />
      </SwitchRow>
      <DialogFoot>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary">
          {t('reports.warn.submit')}
        </Button>
      </DialogFoot>
    </DialogBody>
  )
}
