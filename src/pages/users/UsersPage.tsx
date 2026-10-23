import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import Button, { ButtonLink } from '../../components/Button'
import { useConfirm } from '../../components/ConfirmProvider'
import { BulkBar, cell, Pager, TableWrap, Who } from '../../components/DataTable'
import { compactSelectClass, selectClass } from '../../components/Field'
import Icon from '../../components/Icon'
import { EmptyState, Filters, PageHead, Panel } from '../../components/Panel'
import { Pill, Status } from '../../components/Status'
import { useToast } from '../../components/ToastProvider'
import { useAdminStore } from '../../features/admin/AdminStore'
import { downloadCsv, toCsv } from '../../features/admin/csv'
import { daysAgoToTime, fmt, formatDate } from '../../features/admin/format'
import type { User, UserStatus } from '../../features/admin/types'
import { useCrumbs } from '../../layout/crumbs'
import utils from '../../styles/utils.module.css'
import { inputClass } from '../../components/Field'

const PAGE_SIZE = 8
type SortKey = 'name' | 'rep' | 'joinedDays'
const STATUS_TONE: Record<UserStatus, 'good' | 'warn' | 'crit'> = {
  active: 'good',
  flagged: 'warn',
  suspended: 'crit',
}

export default function UsersPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { users, suspendUsers } = useAdminStore()
  const notify = useToast()
  const confirm = useConfirm()
  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  useCrumbs([
    { label: t('shell.groups.community'), to: '/utilisateurs' },
    { label: t('nav.users') },
  ])

  const q = params.get('q') ?? ''
  const role = params.get('role') ?? 'all'
  const status = params.get('status') ?? 'all'
  const sortKey = (params.get('sort') as SortKey | null) ?? 'joinedDays'
  const dir = params.get('dir') === 'desc' ? 'desc' : 'asc'
  const pageParam = Number(params.get('page')) || 1

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === 'all' || value === '') next.delete(key)
      else next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    const needle = q.toLowerCase()
    const list = users.filter(
      (u) =>
        (!needle || `${u.name} ${u.email}`.toLowerCase().includes(needle)) &&
        (role === 'all' || u.role === role) &&
        (status === 'all' || u.status === status),
    )
    list.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const result = typeof av === 'string' ? av.localeCompare(String(bv)) : Number(av) - Number(bv)
      return dir === 'asc' ? result : -result
    })
    return list
  }, [users, q, role, status, sortKey, dir])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(pageParam, pages)
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const allChecked = rows.length > 0 && rows.every((u) => selected.has(u.id))

  function toggle(id: string, on: boolean) {
    setSelected((s) => {
      const next = new Set(s)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function sortBy(key: SortKey) {
    update({ sort: key, dir: sortKey === key && dir === 'asc' ? 'desc' : 'asc' })
  }

  function exportCsv() {
    const list = selected.size ? users.filter((u) => selected.has(u.id)) : filtered
    downloadCsv(
      'utilisateurs-zetsu.csv',
      toCsv(
        ['name', 'email', 'country', 'role', 'reputation', 'status'],
        list.map((u) => [u.name, u.email, u.country ?? '', u.role, u.rep, u.status]),
      ),
    )
    notify(t('users.exported', { count: list.length }))
  }

  async function bulkSuspend() {
    const ids = [...selected]
    const ok = await confirm({
      title: t('users.bulk.title'),
      text: t('users.bulk.text', { count: ids.length }),
      okLabel: t('users.suspend.submit'),
      danger: true,
    })
    if (!ok) return
    suspendUsers(ids, '7d')
    setSelected(new Set())
    notify(t('users.bulk.done', { count: ids.length }))
  }

  const sortHeader = (key: SortKey, label: string, className = '') => (
    <th
      className={className}
      aria-sort={sortKey === key ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <button type="button" onClick={() => sortBy(key)}>
        {label}
        <Icon name="up" size={12} />
      </button>
    </th>
  )

  const suspended = users.filter((u) => u.status === 'suspended').length
  const flagged = users.filter((u) => u.status === 'flagged').length

  return (
    <>
      <PageHead
        title={t('nav.users')}
        description={t('users.summary', { count: users.length, suspended, flagged })}
        actions={
          <Button onClick={exportCsv}>
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
          onChange={(event) => update({ q: event.target.value, page: null })}
        />
        <label className={utils.srOnly} htmlFor="uRole">
          {t('users.col.role')}
        </label>
        <select
          id="uRole"
          className={`${selectClass} ${compactSelectClass}`}
          value={role}
          onChange={(event) => update({ role: event.target.value, page: null })}
        >
          <option value="all">{t('users.allRoles')}</option>
          <option value="member">{t('users.roles.member')}</option>
          <option value="moderator">{t('users.roles.moderator')}</option>
        </select>
        <label className={utils.srOnly} htmlFor="uStatus">
          {t('users.col.status')}
        </label>
        <select
          id="uStatus"
          className={`${selectClass} ${compactSelectClass}`}
          value={status}
          onChange={(event) => update({ status: event.target.value, page: null })}
        >
          <option value="all">{t('users.allStatuses')}</option>
          {(['active', 'flagged', 'suspended'] as const).map((s) => (
            <option key={s} value={s}>
              {t(`users.status.${s}`)}
            </option>
          ))}
        </select>
      </Filters>

      <Panel>
        {selected.size > 0 && (
          <BulkBar label={t('users.bulk.label')}>
            <b>{t('users.bulk.selected', { count: selected.size })}</b>
            <Button size="sm" onClick={exportCsv}>
              {t('users.bulk.export')}
            </Button>
            <Button size="sm" variant="dangerLine" onClick={bulkSuspend}>
              {t('users.bulk.suspend')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              {t('users.bulk.clear')}
            </Button>
          </BulkBar>
        )}
        {rows.length ? (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      aria-label={t('users.selectPage')}
                      onChange={(event) => rows.forEach((u) => toggle(u.id, event.target.checked))}
                    />
                  </th>
                  {sortHeader('name', t('users.col.user'))}
                  <th className={cell.hideSm}>{t('users.col.country')}</th>
                  <th className={cell.hideSm}>{t('users.col.role')}</th>
                  {sortHeader('rep', t('users.col.reputation'), cell.num)}
                  {sortHeader('joinedDays', t('users.col.joined'), cell.hideSm)}
                  <th>{t('users.col.status')}</th>
                  <th className={cell.right}>
                    <span className={utils.srOnly}>{t('contents.col.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u: User) => (
                  <tr key={u.id} aria-selected={selected.has(u.id)}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        aria-label={t('users.select', { name: u.name })}
                        onChange={(event) => toggle(u.id, event.target.checked)}
                      />
                    </td>
                    <td>
                      <Link to={`/utilisateurs/${u.id}`}>
                        <Who
                          avatar={<Avatar name={u.name} size={32} />}
                          name={u.name}
                          sub={u.email}
                        />
                      </Link>
                    </td>
                    <td className={cell.hideSm}>{u.country ?? t('users.unknownCountry')}</td>
                    <td className={cell.hideSm}>
                      {u.role === 'moderator' ? (
                        <Pill>
                          <Icon name="shield" size={12} />
                          &nbsp;{t('users.roles.moderator')}
                        </Pill>
                      ) : (
                        t('users.roles.member')
                      )}
                    </td>
                    <td className={cell.num}>{fmt(u.rep, lang)}</td>
                    <td className={`${cell.hideSm} ${cell.muted}`}>
                      {formatDate(daysAgoToTime(u.joinedDays), lang, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <Status tone={STATUS_TONE[u.status]}>{t(`users.status.${u.status}`)}</Status>
                    </td>
                    <td className={cell.right}>
                      <ButtonLink size="sm" variant="ghost" to={`/utilisateurs/${u.id}`}>
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
                to: Math.min(page * PAGE_SIZE, filtered.length),
                total: filtered.length,
              })}
            >
              <Button
                size="sm"
                disabled={page === 1}
                onClick={() => update({ page: String(page - 1) })}
              >
                {t('users.previous')}
              </Button>
              <Button
                size="sm"
                disabled={page === pages}
                onClick={() => update({ page: String(page + 1) })}
              >
                {t('users.next')}
              </Button>
            </Pager>
          </>
        ) : (
          <EmptyState title={t('users.noneTitle')}>
            {t('users.noneHint')}
            <div style={{ marginTop: 12 }}>
              <Button onClick={() => setParams({}, { replace: true })}>{t('users.reset')}</Button>
            </div>
          </EmptyState>
        )}
      </Panel>
    </>
  )
}
