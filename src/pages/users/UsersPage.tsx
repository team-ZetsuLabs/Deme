import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Dialog from '../../components/Dialog'
import Field from '../../components/Field'
import ItemCard from '../../components/ItemCard'
import ItemList from '../../components/ItemList'
import PageHeader from '../../components/PageHeader'
import StateMessage from '../../components/StateMessage'
import { useSimulatedLoad } from '../../hooks/useSimulatedLoad'
import { SAMPLE_USERS } from '../../features/users/sampleUsers'
import type { UserItem, UserRole } from '../../features/users/sampleUsers'

const ROLES: UserRole[] = ['member', 'recruiter', 'moderator', 'administrator']

export default function UsersPage() {
  const { t } = useTranslation()
  const loading = useSimulatedLoad()
  const [users, setUsers] = useState<UserItem[]>(SAMPLE_USERS)
  const [search, setSearch] = useState('')
  const [toSuspend, setToSuspend] = useState<UserItem | null>(null)

  const query = search.trim().toLowerCase()
  const visible = users.filter(
    (u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query),
  )

  function update(id: number, patch: Partial<UserItem>) {
    setUsers((items) => items.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }

  return (
    <>
      <PageHeader title={t('users.title')} description={t('users.intro')} />
      <div style={{ marginBottom: 'var(--space-4)', maxWidth: '26rem' }}>
        <Field label={t('users.search')}>
          {(control) => (
            <input
              {...control}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          )}
        </Field>
      </div>

      {loading ? (
        <StateMessage kind="loading" />
      ) : visible.length === 0 ? (
        <StateMessage kind="empty" message={t('users.empty')} />
      ) : (
        <ItemList label={t('nav.users')}>
          {visible.map((user) => (
            <ItemCard
              key={user.id}
              leading={<Avatar name={user.name} />}
              title={user.name}
              meta={`${user.email} · ${user.country}`}
              badges={
                <>
                  <Badge tone="info">{t(`users.level.${user.level}`)}</Badge>
                  <Badge>{t('users.reputation', { count: user.reputation })}</Badge>
                  <Badge tone={user.suspended ? 'danger' : 'success'}>
                    {t(user.suspended ? 'users.suspended' : 'users.active')}
                  </Badge>
                </>
              }
              actions={
                <>
                  <Field label={t('users.role.label')}>
                    {(control) => (
                      <select
                        {...control}
                        value={user.role}
                        onChange={(event) =>
                          update(user.id, { role: event.target.value as UserRole })
                        }
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {t(`users.role.${role}`)}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                  {user.suspended ? (
                    <Button variant="primary" onClick={() => update(user.id, { suspended: false })}>
                      {t('users.reactivate')}
                    </Button>
                  ) : (
                    <Button variant="danger" onClick={() => setToSuspend(user)}>
                      {t('users.suspend')}
                    </Button>
                  )}
                </>
              }
            />
          ))}
        </ItemList>
      )}

      <Dialog
        open={toSuspend !== null}
        title={t('users.suspendDialog.title')}
        onClose={() => setToSuspend(null)}
        footer={
          <>
            <Button onClick={() => setToSuspend(null)}>{t('common.cancel')}</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (toSuspend) update(toSuspend.id, { suspended: true })
                setToSuspend(null)
              }}
            >
              {t('users.suspend')}
            </Button>
          </>
        }
      >
        <p>{t('users.suspendDialog.body', { name: toSuspend?.name })}</p>
      </Dialog>
    </>
  )
}
