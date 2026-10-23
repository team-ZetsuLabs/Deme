import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import Button, { ExternalButtonLink } from '../../components/Button'
import { useConfirm } from '../../components/ConfirmProvider'
import Field, { SwitchRow } from '../../components/Field'
import Icon from '../../components/Icon'
import { Grid2, Panel, PanelBody, PanelHead } from '../../components/Panel'
import Segmented from '../../components/Segmented'
import { Pill, Status } from '../../components/Status'
import { useToast } from '../../components/ToastProvider'
import { useAdminStore } from '../../features/admin/AdminStore'
import { daysAgoToTime, fmt, formatDate, formatDayMonth } from '../../features/admin/format'
import SuspendDialog from '../../features/admin/SuspendDialog'
import type { Duration } from '../../features/admin/SuspendDialog'
import type { MemberRole, User } from '../../features/admin/types'
import { useCrumbs } from '../../layout/crumbs'
import styles from './UserDetailPage.module.css'

type Tab = 'activity' | 'sanctions' | 'logins'
const STATUS_TONE = { active: 'good', flagged: 'warn', suspended: 'crit' } as const
const CONTENT_TONE = { published: 'good', hidden: 'serious', closed: 'neutral' } as const

export default function UserDetailPage() {
  const { id = '' } = useParams()
  const { users } = useAdminStore()
  const user = users.find((u) => u.id === id)
  if (!user) return <Navigate to="/utilisateurs" replace />
  return <UserDetail user={user} />
}

function UserDetail({ user }: { user: User }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const store = useAdminStore()
  const notify = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('activity')
  const [suspending, setSuspending] = useState(false)
  useCrumbs([
    { label: t('shell.groups.community'), to: '/utilisateurs' },
    { label: t('nav.users'), to: '/utilisateurs' },
    { label: user.name },
  ])

  const contents = store.contents.filter((c) => c.author === user.id)
  const sanctions = [
    ...(user.warnings
      ? [
          {
            key: 'warning-1',
            at: daysAgoToTime(1),
            text: t('users.sanction.aggressive'),
            by: 'eric',
          },
        ]
      : []),
    ...(user.warnings > 1
      ? [{ key: 'warning-2', at: daysAgoToTime(26), text: t('users.sanction.promo'), by: 'mariam' }]
      : []),
    ...(user.status === 'suspended'
      ? [
          {
            key: 'suspension',
            at: daysAgoToTime(2),
            text: t('users.sanction.suspension'),
            by: 'salif',
          },
        ]
      : []),
  ]

  async function changeRole(next: MemberRole) {
    const ok = await confirm({
      title: t('users.roleChange.title'),
      text: t('users.roleChange.text', { name: user.name, role: t(`users.roles.${next}`) }),
      okLabel: t('users.roleChange.ok'),
    })
    if (!ok) return
    store.setUserRole(user.id, next)
    notify(
      t('users.roleChange.done', { name: user.name, role: t(`users.roles.${next}`).toLowerCase() }),
    )
  }

  async function remove() {
    const ok = await confirm({
      title: t('users.delete.title'),
      text: t('users.delete.text', { name: user.name }),
      okLabel: t('users.delete.ok'),
      danger: true,
    })
    if (!ok) return
    store.deleteUser(user.id)
    navigate('/utilisateurs')
    notify(t('users.delete.done', { name: user.name }))
  }

  function suspend(target: User, duration: Duration, reason: string) {
    store.suspendUsers([target.id], duration, reason)
    setSuspending(false)
    notify(
      t('users.suspend.done', { name: target.name, duration: t(`users.durations.${duration}`) }),
    )
  }

  const tabOptions = [
    { value: 'activity' as Tab, label: t('users.tabs.activity') },
    { value: 'sanctions' as Tab, label: t('users.tabs.sanctions', { count: sanctions.length }) },
    { value: 'logins' as Tab, label: t('users.tabs.logins') },
  ]

  return (
    <>
      <Panel>
        <PanelBody className={styles.profileHead}>
          <Avatar name={user.name} size={64} />
          <div>
            <h1>{user.name}</h1>
            <p className={styles.sub}>
              {t('users.profile.line', {
                email: user.email,
                country: user.country ?? t('users.unknownCountry'),
                date: formatDate(daysAgoToTime(user.joinedDays), lang, {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }),
                provider: user.provider,
              })}
            </p>
            <div style={{ marginTop: 6 }}>
              <Status tone={STATUS_TONE[user.status]}>{t(`users.status.${user.status}`)}</Status>
            </div>
          </div>
          <div className={styles.actions}>
            <ExternalButtonLink href={`/profil/${user.id}`} target="_blank" rel="noopener">
              {t('users.profile.public')}
              <Icon name="ext" size={13} />
            </ExternalButtonLink>
            {user.status === 'suspended' ? (
              <Button
                onClick={() => {
                  store.reactivateUser(user.id)
                  notify(t('users.reactivated', { name: user.name }))
                }}
              >
                {t('users.reactivate')}
              </Button>
            ) : (
              <Button variant="dangerLine" onClick={() => setSuspending(true)}>
                {t('users.suspend.action')}
              </Button>
            )}
          </div>
        </PanelBody>
        <div className={styles.strip}>
          <div>
            <strong>{fmt(user.rep, lang)}</strong>
            <span>{t('users.stat.reputation')}</span>
          </div>
          <div>
            <strong>{user.questions}</strong>
            <span>{t('users.stat.questions')}</span>
          </div>
          <div>
            <strong>{user.answers}</strong>
            <span>{t('users.stat.answers')}</span>
          </div>
          <div>
            <strong>{user.warnings}</strong>
            <span>{t('users.stat.warnings')}</span>
          </div>
        </div>
      </Panel>

      <Grid2 className={styles.below}>
        <Panel>
          <div className={styles.tabbar}>
            <Segmented<Tab>
              kind="tabs"
              underline
              label={t('users.tabs.label')}
              options={tabOptions}
              value={tab}
              onChange={setTab}
            />
          </div>
          <PanelBody>
            {tab === 'activity' &&
              (contents.length ? (
                <ul className={styles.timeline}>
                  {contents.map((c) => (
                    <li key={c.id}>
                      <time>{formatDayMonth(daysAgoToTime(c.daysAgo), lang)}</time>
                      <span>
                        {t('users.published')}{' '}
                        <a href={`/question/${c.id}`} target="_blank" rel="noopener">
                          {c.title}
                        </a>{' '}
                        <Status tone={CONTENT_TONE[c.status]}>
                          {t(`contents.status.${c.status}`)}
                        </Status>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>
                  {t('users.noQuestions')} {t('users.answersTotal', { count: user.answers })}
                </p>
              ))}
            {tab === 'sanctions' &&
              (sanctions.length ? (
                <ul className={styles.timeline}>
                  {sanctions.map((s) => (
                    <li key={s.key}>
                      <time>{formatDate(s.at, lang)}</time>
                      <span>
                        {s.text}{' '}
                        <span className={styles.muted}>
                          {t('users.by', { name: store.staffBy(s.by).name })}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>{t('users.noSanctions')}</p>
              ))}
            {tab === 'logins' && (
              <ul className={styles.timeline}>
                <li>
                  <time>{t('users.today')}</time>
                  <span>
                    {t('users.login.today', {
                      provider: user.provider,
                      country: user.country ?? '',
                    })}
                  </span>
                </li>
                <li>
                  <time>{t('users.yesterday')}</time>
                  <span>{t('users.login.yesterday', { provider: user.provider })}</span>
                </li>
                <li>
                  <time>{formatDayMonth(daysAgoToTime(4), lang)}</time>
                  <span>{t('users.login.password')}</span>
                </li>
              </ul>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title={t('users.manage.title')} />
          <PanelBody>
            <Field label={t('users.col.role')} hint={t('users.manage.roleHint')} select>
              {(control) => (
                <select
                  {...control}
                  value={user.role}
                  onChange={(event) => changeRole(event.target.value as MemberRole)}
                >
                  <option value="member">{t('users.roles.member')}</option>
                  <option value="moderator">{t('users.roles.moderator')}</option>
                </select>
              )}
            </Field>
            <SwitchRow
              title={t('users.manage.recruiters')}
              description={t('users.manage.recruitersHint')}
            >
              <Pill>{user.rep > 100 ? t('users.yes') : t('users.no')}</Pill>
            </SwitchRow>
            <SwitchRow title={t('users.manage.reset')} description={t('users.manage.resetHint')}>
              <Button
                size="sm"
                onClick={() => {
                  store.logPasswordReset(user.id)
                  notify(t('users.manage.resetDone'))
                }}
              >
                {t('users.manage.send')}
              </Button>
            </SwitchRow>
            <SwitchRow title={t('users.manage.delete')} description={t('users.manage.deleteHint')}>
              <Button size="sm" variant="dangerLine" onClick={remove}>
                {t('users.delete.ok')}
              </Button>
            </SwitchRow>
          </PanelBody>
        </Panel>
      </Grid2>

      <SuspendDialog
        user={suspending ? user : null}
        onClose={() => setSuspending(false)}
        onConfirm={suspend}
      />
      <p style={{ marginTop: 24 }}>
        <Link to="/utilisateurs">{t('users.backToList')}</Link>
      </p>
    </>
  )
}
