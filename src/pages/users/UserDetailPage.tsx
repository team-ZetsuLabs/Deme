import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import { errorMessage } from '../../api/errorMessage'
import type { AdminUser, Role } from '../../api/types'
import { useQuery } from '../../api/useQuery'
import Avatar from '../../components/Avatar'
import Button, { ExternalButtonLink } from '../../components/Button'
import { useConfirm } from '../../components/ConfirmProvider'
import Field from '../../components/Field'
import Icon from '../../components/Icon'
import NoteDialog from '../../components/NoteDialog'
import { EmptyState, Panel, PanelBody, PanelHead } from '../../components/Panel'
import QueryState from '../../components/QueryState'
import { Status } from '../../components/Status'
import { useToast } from '../../components/ToastProvider'
import { siteUrl } from '../../config'
import { fmt, formatDate } from '../../features/admin/format'
import MemberTabs from '../../features/members/MemberTabs'
import { useAuth } from '../../hooks/useAuth'
import { useCrumbs } from '../../layout/crumbs'
import styles from './UserDetailPage.module.css'

const ROLES: Role[] = ['MEMBER', 'RECRUITER', 'MODERATOR', 'ADMIN']
const TONE = { ACTIVE: 'good', SUSPENDED: 'crit', DELETED: 'neutral' } as const

export default function UserDetailPage() {
  const { username = '' } = useParams()
  const { t } = useTranslation()
  const query = useQuery(
    async (signal) => {
      const page = await adminApi.listUsers({ q: username, size: 20 }, { signal })
      return page.items.find((u) => u.username === username) ?? null
    },
    [username],
  )
  useCrumbs([
    { label: t('shell.groups.community'), to: '/utilisateurs' },
    { label: t('nav.users'), to: '/utilisateurs' },
    { label: username },
  ])

  return (
    <QueryState
      query={query}
      isEmpty={(user) => user === null}
      empty={
        <Panel>
          <EmptyState title={t('users.notFound')}>
            <Link to="/utilisateurs">{t('users.backToList')}</Link>
          </EmptyState>
        </Panel>
      }
    >
      {(user) => user && <UserDetail user={user} reload={query.reload} />}
    </QueryState>
  )
}

function UserDetail({ user, reload }: { user: AdminUser; reload: () => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { me, isAdmin } = useAuth()
  const notify = useToast()
  const confirm = useConfirm()
  const [suspending, setSuspending] = useState(false)
  const self = me?.id === user.id
  const protectedAccount = user.role === 'ADMIN' || user.role === 'MODERATOR'

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action()
      notify(success)
      reload()
    } catch (error) {
      notify(errorMessage(t, error))
    }
  }

  async function changeRole(next: Role) {
    const ok = await confirm({
      title: t('users.roleChange.title'),
      text: t('users.roleChange.text', { name: user.displayName, role: t(`roles.${next}`) }),
      okLabel: t('users.roleChange.ok'),
    })
    if (!ok) return
    await run(
      () => adminApi.setRole(user.id, next),
      t('users.roleChange.done', {
        name: user.displayName,
        role: t(`roles.${next}`).toLowerCase(),
      }),
    )
  }

  return (
    <>
      <Panel>
        <PanelBody className={styles.profileHead}>
          <Avatar name={user.displayName} size={64} />
          <div>
            <h1>{user.displayName}</h1>
            <p className={styles.sub}>
              {t('users.profile.line', {
                handle: user.username,
                email: user.email ?? '-',
                country: user.countryCode ?? t('users.unknownCountry'),
                date: formatDate(user.createdAt, lang, {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }),
              })}
            </p>
            <div style={{ marginTop: 6 }}>
              <Status tone={TONE[user.status]}>{t(`userStatus.${user.status}`)}</Status>
            </div>
          </div>
          <div className={styles.actions}>
            <ExternalButtonLink
              href={siteUrl(`profil/${encodeURIComponent(user.username)}`)}
              target="_blank"
              rel="noopener"
            >
              {t('users.profile.public')}
              <Icon name="ext" size={13} />
            </ExternalButtonLink>
            {user.status === 'SUSPENDED' ? (
              <Button
                onClick={() =>
                  run(
                    () => adminApi.reactivate(user.id),
                    t('users.reactivated', { name: user.displayName }),
                  )
                }
              >
                {t('users.reactivate')}
              </Button>
            ) : (
              user.status === 'ACTIVE' && (
                <Button
                  variant="dangerLine"
                  disabled={self || protectedAccount}
                  title={self || protectedAccount ? t('users.cannotSuspend') : undefined}
                  onClick={() => setSuspending(true)}
                >
                  {t('users.suspend.action')}
                </Button>
              )
            )}
          </div>
        </PanelBody>
        <div className={styles.strip}>
          <div>
            <strong>{fmt(user.reputation, lang)}</strong>
            <span>{t('users.stat.reputation')}</span>
          </div>
          <div>
            <strong>{t(`levels.${user.level}`)}</strong>
            <span>{t('users.stat.level')}</span>
          </div>
          <div>
            <strong>{user.hiddenContentCount}</strong>
            <span>{t('users.stat.hidden')}</span>
          </div>
          <div>
            <strong>{user.warningCount}</strong>
            <span>{t('users.stat.warnings')}</span>
          </div>
        </div>
      </Panel>

      <Panel className={styles.below}>
        <MemberTabs username={user.username} />
      </Panel>
      <div className={styles.below} style={{ maxWidth: 560 }}>
        <Panel>
          <PanelHead title={t('users.manage.title')} />
          <PanelBody>
            <Field
              label={t('users.col.role')}
              hint={isAdmin ? t('users.manage.roleHint') : t('users.manage.adminOnly')}
              select
            >
              {(control) => (
                <select
                  {...control}
                  value={user.role}
                  disabled={!isAdmin || self}
                  onChange={(event) => changeRole(event.target.value as Role)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {t(`roles.${r}`)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            {user.suspensionReason && (
              <p style={{ fontSize: 14 }}>
                <b>{t('users.suspensionReason')}</b> {user.suspensionReason}
              </p>
            )}
          </PanelBody>
        </Panel>
      </div>

      <NoteDialog
        open={suspending}
        title={t('users.suspend.title')}
        lead={t('users.suspend.lead', { name: user.displayName })}
        label={t('users.suspend.reason')}
        hint={t('users.suspend.hint')}
        minLength={10}
        submitLabel={t('users.suspend.submit')}
        danger
        onClose={() => setSuspending(false)}
        onSubmit={async (reason) => {
          setSuspending(false)
          await run(
            () => adminApi.suspend(user.id, reason),
            t('users.suspend.done', { name: user.displayName }),
          )
        }}
      />
      <p style={{ marginTop: 24 }}>
        <Link to="/utilisateurs">{t('users.backToList')}</Link>
      </p>
    </>
  )
}
