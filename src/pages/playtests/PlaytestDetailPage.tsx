import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { playtestApi } from '../../api/endpoints'
import { errorMessage } from '../../api/errorMessage'
import type { PlaytestDetail, PlaytestParticipation } from '../../api/types'
import { useQuery } from '../../api/useQuery'
import Avatar from '../../components/Avatar'
import Button, { ButtonLink } from '../../components/Button'
import { cell, TableWrap, Who } from '../../components/DataTable'
import MemberContent from '../../components/MemberContent'
import NoteDialog from '../../components/NoteDialog'
import { EmptyState, Grid2, Panel, PanelBody, PanelHead } from '../../components/Panel'
import QueryState from '../../components/QueryState'
import { Status } from '../../components/Status'
import { useToast } from '../../components/ToastProvider'
import { formatAgo, formatDate, formatDateTime } from '../../features/admin/format'
import { safeHttpUrl } from '../../features/challenges/safeUrl'
import AppIcon from '../../features/playtests/AppIcon'
import { PLAYTEST_TONE } from '../../features/playtests/tones'
import { useCounts } from '../../layout/counts'
import { useCrumbs } from '../../layout/crumbs'
import styles from './PlaytestDetailPage.module.css'
import utils from '../../styles/utils.module.css'

type Action = 'approve' | 'reject' | 'suspend' | 'reactivate'
const PART_TONE = {
  JOINED: 'neutral',
  CONFIRMED: 'warn',
  VERIFIED: 'good',
  COMPLETED: 'good',
  DROPPED: 'neutral',
  REMOVED: 'crit',
} as const

export default function PlaytestDetailPage() {
  const { id } = useParams()
  const campaignId = Number(id)
  const { t } = useTranslation()
  const query = useQuery((signal) => playtestApi.detail(campaignId, { signal }), [campaignId])
  useCrumbs([
    { label: t('shell.groups.community'), to: '/utilisateurs' },
    { label: t('nav.playtests'), to: '/tests' },
    { label: query.data?.appName ?? t('common.loading') },
  ])
  return (
    <QueryState query={query}>
      {(campaign) => <Detail campaign={campaign} reload={query.reload} />}
    </QueryState>
  )
}

function Detail({ campaign, reload }: { campaign: PlaytestDetail; reload: () => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const notify = useToast()
  const counts = useCounts()
  const [acting, setActing] = useState<Action | null>(null)
  const [removing, setRemoving] = useState<PlaytestParticipation | null>(null)
  const [busy, setBusy] = useState(false)

  const participations = useQuery(
    (signal) => playtestApi.participations(campaign.id, { signal }),
    [campaign.id],
  )
  const events = useQuery((signal) => playtestApi.events(campaign.id, { signal }), [campaign.id])
  const optIn = campaign.optInUrl ? safeHttpUrl(campaign.optInUrl) : null

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true)
    try {
      await action()
      notify(success)
      reload()
      participations.reload()
      events.reload()
      counts.refresh()
    } catch (error) {
      notify(errorMessage(t, error))
    } finally {
      setBusy(false)
    }
  }

  const canReview = campaign.status === 'PENDING_REVIEW'
  const canSuspend = campaign.status === 'ACTIVE'
  const canReactivate = campaign.status === 'SUSPENDED'

  return (
    <>
      <Panel>
        <PanelBody className={styles.head}>
          <AppIcon name={campaign.appName} iconUrl={campaign.iconUrl} size={56} />
          <div className={styles.titles}>
            <h1>{campaign.appName}</h1>
            <p className={styles.sub}>
              {t(`playtestPlatform.${campaign.platform}`)}
              {campaign.packageName ? `, ${campaign.packageName}` : ''}
              {', '}
              {t(`playtests.tracking.${campaign.tracking}`)}
              {', '}
              {t('playtests.detail.createdOn', { date: formatDate(campaign.createdAt, lang) })}
            </p>
            <div style={{ marginTop: 6 }}>
              <Status tone={PLAYTEST_TONE[campaign.status]}>
                {t(`playtestStatus.${campaign.status}`)}
              </Status>
            </div>
          </div>
          <div className={styles.actions}>
            {canReview && (
              <>
                <Button
                  variant="primary"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => playtestApi.review(campaign.id, 'APPROVE'),
                      t('playtests.toast.approved'),
                    )
                  }
                >
                  {t('playtests.action.approve')}
                </Button>
                <Button variant="dangerLine" onClick={() => setActing('reject')}>
                  {t('playtests.action.reject')}
                </Button>
              </>
            )}
            {canSuspend && (
              <Button variant="dangerLine" onClick={() => setActing('suspend')}>
                {t('playtests.action.suspend')}
              </Button>
            )}
            {canReactivate && (
              <Button variant="primary" onClick={() => setActing('reactivate')}>
                {t('playtests.action.reactivate')}
              </Button>
            )}
            <ButtonLink to="/tests">{t('playtests.detail.back')}</ButtonLink>
          </div>
        </PanelBody>
        <div className={styles.strip}>
          <div>
            <strong>{campaign.progress.percent} %</strong>
            <span>{t('playtests.detail.progress')}</span>
          </div>
          <div>
            <strong>
              {campaign.testersTarget - campaign.spotsLeft}/{campaign.testersTarget}
            </strong>
            <span>{t('playtests.detail.spots')}</span>
          </div>
          <div>
            <strong>{campaign.requiredDays || '-'}</strong>
            <span>{t('playtests.detail.days')}</span>
          </div>
          <div>
            <strong>{campaign.progress.completed}</strong>
            <span>{t('playtests.detail.completed')}</span>
          </div>
        </div>
      </Panel>

      <Grid2 className={styles.below}>
        <div className={styles.column}>
          <Panel>
            <PanelHead title={t('playtests.detail.description')} />
            <PanelBody>
              <MemberContent html={campaign.descriptionHtml} />
              {optIn && (
                <p className={styles.line}>
                  <b>{t('playtests.detail.optIn')}</b>{' '}
                  <a href={optIn} target="_blank" rel="noopener noreferrer">
                    {optIn}
                  </a>
                </p>
              )}
              {campaign.instructions && (
                <>
                  <h3 className={styles.subtitle}>{t('playtests.detail.instructions')}</h3>
                  <p className={styles.plain}>{campaign.instructions}</p>
                </>
              )}
              {campaign.reviewNote && (
                <p className={styles.line}>
                  <b>{t('playtests.detail.reviewNote')}</b> {campaign.reviewNote}
                </p>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title={t('playtests.detail.testers')} />
            <QueryState
              query={participations}
              isEmpty={(d) => d.length === 0}
              empty={<EmptyState title={t('playtests.detail.noTesters')} />}
            >
              {(d) => (
                <TableWrap>
                  <thead>
                    <tr>
                      <th>{t('playtests.detail.tester')}</th>
                      <th>{t('playtests.col.status')}</th>
                      <th className={cell.num}>{t('playtests.detail.daysDone')}</th>
                      <th className={cell.hideSm}>{t('playtests.detail.google')}</th>
                      <th className={cell.right}>
                        <span className={utils.srOnly}>{t('users.col.actions')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <Link to={`/utilisateurs/${encodeURIComponent(p.tester.username)}`}>
                            <Who
                              avatar={<Avatar name={p.tester.displayName} size={28} />}
                              name={p.tester.displayName}
                            />
                          </Link>
                        </td>
                        <td>
                          <Status tone={PART_TONE[p.status]}>
                            {t(`participationStatus.${p.status}`)}
                          </Status>
                          {p.needsAttention && (
                            <small className={cell.sub}>
                              {t('playtests.detail.needsAttention')}
                            </small>
                          )}
                          {p.dropReason && <small className={cell.sub}>{p.dropReason}</small>}
                        </td>
                        <td className={cell.num}>{p.daysDone}</td>
                        <td className={cell.hideSm}>
                          {p.googleEmail ?? <span className={cell.muted}>-</span>}
                        </td>
                        <td>
                          <div className={cell.rowActions}>
                            {(p.status === 'JOINED' ||
                              p.status === 'CONFIRMED' ||
                              p.status === 'VERIFIED') && (
                              <Button size="sm" variant="ghost" onClick={() => setRemoving(p)}>
                                {t('playtests.action.removeTester')}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </QueryState>
          </Panel>
        </div>

        <div className={styles.column}>
          <Panel>
            <PanelHead title={t('playtests.detail.owner')} />
            <PanelBody>
              <Link to={`/utilisateurs/${encodeURIComponent(campaign.owner.username)}`}>
                <Who
                  avatar={<Avatar name={campaign.owner.displayName} size={36} />}
                  name={campaign.owner.displayName}
                  sub={t(`levels.${campaign.owner.level}`)}
                />
              </Link>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title={t('playtests.detail.history')} />
            <QueryState
              query={events}
              isEmpty={(d) => d.items.length === 0}
              empty={<EmptyState title={t('playtests.detail.noHistory')} />}
            >
              {(d) => (
                <PanelBody>
                  <ul className={styles.timeline}>
                    {d.items.map((e) => (
                      <li key={e.id}>
                        <time title={formatDateTime(e.createdAt, lang)}>
                          {formatAgo(e.createdAt, lang)}
                        </time>
                        <span>
                          <b>{t(`playtestEvents.${e.action}`)}</b>
                          <small className={cell.sub}>
                            {e.actor ? e.actor.displayName : t('playtests.detail.automatic')}
                            {e.note ? `, ${e.note}` : ''}
                          </small>
                        </span>
                      </li>
                    ))}
                  </ul>
                </PanelBody>
              )}
            </QueryState>
          </Panel>
        </div>
      </Grid2>

      <NoteDialog
        open={acting !== null}
        title={acting ? t(`playtests.note.${acting}.title`) : ''}
        lead={acting ? t(`playtests.note.${acting}.lead`, { name: campaign.appName }) : undefined}
        label={t('playtests.note.label')}
        hint={
          acting === 'reject' || acting === 'suspend'
            ? t('playtests.note.required')
            : t('playtests.note.optional')
        }
        minLength={acting === 'reject' || acting === 'suspend' ? 10 : 0}
        maxLength={300}
        submitLabel={acting ? t(`playtests.action.${acting}`) : ''}
        danger={acting === 'reject' || acting === 'suspend'}
        onClose={() => setActing(null)}
        onSubmit={async (note) => {
          const current = acting
          setActing(null)
          if (!current) return
          if (current === 'reject')
            await run(
              () => playtestApi.review(campaign.id, 'REJECT', note),
              t('playtests.toast.rejected'),
            )
          if (current === 'approve')
            await run(
              () => playtestApi.review(campaign.id, 'APPROVE', note || undefined),
              t('playtests.toast.approved'),
            )
          if (current === 'suspend')
            await run(() => playtestApi.suspend(campaign.id, note), t('playtests.toast.suspended'))
          if (current === 'reactivate')
            await run(
              () => playtestApi.reactivate(campaign.id, note || undefined),
              t('playtests.toast.reactivated'),
            )
        }}
      />
      <NoteDialog
        open={removing !== null}
        title={t('playtests.note.remove.title')}
        lead={
          removing
            ? t('playtests.note.remove.lead', { name: removing.tester.displayName })
            : undefined
        }
        label={t('playtests.note.label')}
        hint={t('playtests.note.removeHint')}
        minLength={5}
        maxLength={300}
        submitLabel={t('playtests.action.removeTester')}
        danger
        onClose={() => setRemoving(null)}
        onSubmit={async (reason) => {
          const target = removing
          setRemoving(null)
          if (target)
            await run(
              () => playtestApi.removeTester(campaign.id, target.id, reason),
              t('playtests.toast.removed'),
            )
        }}
      />
    </>
  )
}
