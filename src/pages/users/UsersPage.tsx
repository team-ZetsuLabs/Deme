import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import type { AdminUser } from '../../api/types'
import { useQuery } from '../../api/useQuery'
import Avatar from '../../components/Avatar'
import Button, { ButtonLink } from '../../components/Button'
import { cell, Pager, TableWrap, Who } from '../../components/DataTable'
import { compactSelectClass, inputClass, selectClass } from '../../components/Field'
import Icon from '../../components/Icon'
import { EmptyState, Filters, PageHead, Panel } from '../../components/Panel'
import QueryState from '../../components/QueryState'
import { Pill, Status } from '../../components/Status'
import { useToast } from '../../components/ToastProvider'
import { downloadCsv, toCsv } from '../../features/admin/csv'
import { fmt, formatDate } from '../../features/admin/format'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useCrumbs } from '../../layout/crumbs'
import utils from '../../styles/utils.module.css'

const PAGE_SIZE = 20
const ROLES = ['MEMBER', 'RECRUITER', 'MODERATOR', 'ADMIN'] as const
const STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const
const TONE = { ACTIVE: 'good', SUSPENDED: 'crit', DELETED: 'neutral' } as const

export default function UsersPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const notify = useToast()
  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  useCrumbs([
    { label: t('shell.groups.community'), to: '/utilisateurs' },
    { label: t('nav.users') },
  ])

  const q = params.get('q') ?? ''
  const role = (params.get('role') as (typeof ROLES)[number] | null) ?? undefined
  const status = (params.get('status') as (typeof STATUSES)[number] | null) ?? undefined
  const page = Math.max(1, Number(params.get('page')) || 1)

  const debouncedQ = useDebouncedValue(q)

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: true })
  }

  const query = useQuery(
    (signal) =>
      adminApi.listUsers(
        { q: q || undefined, role, status, page: page - 1, size: PAGE_SIZE },
        { signal },
      ),
    [debouncedQ, role, status, page],
  )

  function toggle(id: number, on: boolean) {
    setSelected((s) => {
      const next = new Set(s)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function exportCsv(rows: AdminUser[]) {
    const list = selected.size ? rows.filter((u) => selected.has(u.id)) : rows
    downloadCsv(
      'utilisateurs-zetsu.csv',
      toCsv(
        ['username', 'name', 'email', 'country', 'role', 'level', 'reputation', 'status'],
        list.map((u) => [
          u.username,
          u.displayName,
          u.email ?? '',
          u.countryCode ?? '',
          u.role,
          u.level,
          u.reputation,
          u.status,
        ]),
      ),
    )
    notify(t('users.exported', { count: list.length }))
  }

  const data = query.data
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <>
      <PageHead
        title={t('nav.users')}
        description={data ? t('users.summary', { count: data.total }) : t('users.lead')}
        actions={
          <Button onClick={() => data && exportCsv(data.items)} disabled={!data?.items.length}>
            <Icon name="dl" size={15} />
            {t('users.exportCsv')}
          </Button>
        }
      />
      <Filters>
        <label className={utils.srOnly} htmlFor="uSearch">
          {t('users.search')}
        </label>
        <input
          id="uSearch"
          type="search"
          className={inputClass}
          style={{ width: 260, minHeight: 36, fontSize: 14 }}
          placeholder={t('users.searchPlaceholder')}
          value={q}
          onChange={(event) => update({ q: event.target.value || null, page: null })}
        />
        <label className={utils.srOnly} htmlFor="uRole">
          {t('users.col.role')}
        </label>
        <select
          id="uRole"
          className={`${selectClass} ${compactSelectClass}`}
          value={role ?? ''}
          onChange={(event) => update({ role: event.target.value || null, page: null })}
        >
          <option value="">{t('users.allRoles')}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {t(`roles.${r}`)}
            </option>
          ))}
        </select>
        <label className={utils.srOnly} htmlFor="uStatus">
          {t('users.col.status')}
        </label>
        <select
          id="uStatus"
          className={`${selectClass} ${compactSelectClass}`}
          value={status ?? ''}
          onChange={(event) => update({ status: event.target.value || null, page: null })}
        >
          <option value="">{t('users.allStatuses')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`userStatus.${s}`)}
            </option>
          ))}
        </select>
      </Filters>

      <Panel>
        <QueryState
          query={query}
          isEmpty={(d) => d.items.length === 0}
          empty={
            <EmptyState title={t('users.noneTitle')}>
              {t('users.noneHint')}
              <div style={{ marginTop: 12 }}>
                <Button onClick={() => setParams({}, { replace: true })}>{t('users.reset')}</Button>
              </div>
            </EmptyState>
          }
        >
          {(d) => (
            <>
              <TableWrap>
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>
                      <input
                        type="checkbox"
                        checked={d.items.every((u) => selected.has(u.id))}
                        aria-label={t('users.selectPage')}
                        onChange={(event) =>
                          d.items.forEach((u) => toggle(u.id, event.target.checked))
                        }
                      />
                    </th>
                    <th>{t('users.col.user')}</th>
                    <th className={cell.hideSm}>{t('users.col.country')}</th>
                    <th className={cell.hideSm}>{t('users.col.role')}</th>
                    <th className={cell.num}>{t('users.col.reputation')}</th>
                    <th className={cell.hideSm}>{t('users.col.joined')}</th>
                    <th>{t('users.col.status')}</th>
                    <th className={cell.right}>
                      <span className={utils.srOnly}>{t('users.col.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((u) => (
                    <tr key={u.id} aria-selected={selected.has(u.id)}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(u.id)}
                          aria-label={t('users.select', { name: u.displayName })}
                          onChange={(event) => toggle(u.id, event.target.checked)}
                        />
                      </td>
                      <td>
                        <Link to={`/utilisateurs/${encodeURIComponent(u.username)}`}>
                          <Who
                            avatar={<Avatar name={u.displayName} size={32} />}
                            name={u.displayName}
                            sub={u.email ?? `@${u.username}`}
                          />
                        </Link>
                      </td>
                      <td className={cell.hideSm}>{u.countryCode ?? t('users.unknownCountry')}</td>
                      <td className={cell.hideSm}>
                        {u.role === 'MEMBER' ? (
                          t(`roles.${u.role}`)
                        ) : (
                          <Pill>
                            <Icon name="shield" size={12} />
                            &nbsp;{t(`roles.${u.role}`)}
                          </Pill>
                        )}
                      </td>
                      <td className={cell.num}>{fmt(u.reputation, lang)}</td>
                      <td className={`${cell.hideSm} ${cell.muted}`}>
                        {formatDate(u.createdAt, lang, {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <Status tone={TONE[u.status]}>{t(`userStatus.${u.status}`)}</Status>
                      </td>
                      <td className={cell.right}>
                        <ButtonLink
                          size="sm"
                          variant="ghost"
                          to={`/utilisateurs/${encodeURIComponent(u.username)}`}
                        >
                          {t('users.view')}
                        </ButtonLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
              <Pager
                summary={t('users.range', {
                  from: (page - 1) * PAGE_SIZE + 1,
                  to: Math.min(page * PAGE_SIZE, d.total),
                  total: d.total,
                })}
              >
                <Button
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => update({ page: String(page - 1) })}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  size="sm"
                  disabled={page >= pages}
                  onClick={() => update({ page: String(page + 1) })}
                >
                  {t('common.next')}
                </Button>
              </Pager>
            </>
          )}
        </QueryState>
      </Panel>
    </>
  )
}
