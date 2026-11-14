import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from '../../api/endpoints'
import { errorMessage } from '../../api/errorMessage'
import type { AdminCommunity, AdminCommunityProposal, CommunityRequest } from '../../api/types'
import { useQuery } from '../../api/useQuery'
import Button from '../../components/Button'
import { cell, TableWrap } from '../../components/DataTable'
import Dialog, { DialogBody, DialogFoot, DialogLead } from '../../components/Dialog'
import Field, { compactSelectClass, inputClass, selectClass } from '../../components/Field'
import Icon from '../../components/Icon'
import NoteDialog from '../../components/NoteDialog'
import { EmptyState, Filters, PageHead, Panel } from '../../components/Panel'
import QueryState from '../../components/QueryState'
import Segmented from '../../components/Segmented'
import { Pill, Status } from '../../components/Status'
import { useToast } from '../../components/ToastProvider'
import { formatDate } from '../../features/admin/format'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useCounts } from '../../layout/counts'
import { useCrumbs } from '../../layout/crumbs'
import styles from './CommunitiesPage.module.css'
import utils from '../../styles/utils.module.css'

type Tab = 'communities' | 'proposals'
type ProposalTab = 'PENDING' | 'APPROVED' | 'REJECTED'

export default function CommunitiesPage() {
  const { t } = useTranslation()
  const counts = useCounts()
  const [tab, setTab] = useState<Tab>('communities')
  useCrumbs([
    { label: t('shell.groups.community'), to: '/utilisateurs' },
    { label: t('nav.communities') },
  ])

  return (
    <>
      <PageHead title={t('nav.communities')} description={t('communities.lead')} />
      <Filters>
        <Segmented<Tab>
          kind="tabs"
          label={t('communities.sections')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'communities', label: t('communities.tab.communities') },
            { value: 'proposals', label: t('communities.tab.proposals'), count: counts.proposals },
          ]}
        />
      </Filters>
      {tab === 'communities' ? <CommunityList /> : <ProposalList />}
    </>
  )
}

function CommunityList() {
  const { t } = useTranslation()
  const notify = useToast()
  const [status, setStatus] = useState<'' | 'OPEN' | 'CLOSED'>('')
  const [kind, setKind] = useState<'' | 'COUNTRY' | 'TECH'>('')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [referents, setReferents] = useState<AdminCommunity | null>(null)
  const q = useDebouncedValue(search)

  const query = useQuery(
    (signal) =>
      adminApi.listCommunities(
        { status: status || undefined, kind: kind || undefined, q: q || undefined, size: 50 },
        { signal },
      ),
    [status, kind, q],
  )

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action()
      notify(success)
      query.reload()
    } catch (error) {
      notify(errorMessage(t, error))
    }
  }

  return (
    <>
      <Filters>
        <label className={utils.srOnly} htmlFor="comSearch">
          {t('communities.search')}
        </label>
        <input
          id="comSearch"
          type="search"
          className={inputClass}
          style={{ width: 240, minHeight: 36, fontSize: 14 }}
          placeholder={t('communities.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <label className={utils.srOnly} htmlFor="comKind">
          {t('communities.col.kind')}
        </label>
        <select
          id="comKind"
          className={`${selectClass} ${compactSelectClass}`}
          value={kind}
          onChange={(event) => setKind(event.target.value as typeof kind)}
        >
          <option value="">{t('communities.allKinds')}</option>
          <option value="COUNTRY">{t('communityKind.COUNTRY')}</option>
          <option value="TECH">{t('communityKind.TECH')}</option>
        </select>
        <label className={utils.srOnly} htmlFor="comStatus">
          {t('communities.col.status')}
        </label>
        <select
          id="comStatus"
          className={`${selectClass} ${compactSelectClass}`}
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
        >
          <option value="">{t('communities.allStatuses')}</option>
          <option value="OPEN">{t('communityStatus.OPEN')}</option>
          <option value="CLOSED">{t('communityStatus.CLOSED')}</option>
        </select>
        <span style={{ flex: 1 }} />
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={13} />
          {t('communities.create')}
        </Button>
      </Filters>
      <Panel>
        <QueryState
          query={query}
          isEmpty={(d) => d.items.length === 0}
          empty={
            <EmptyState title={t('communities.emptyTitle')}>
              {t('communities.emptyHint')}
            </EmptyState>
          }
        >
          {(d) => (
            <TableWrap>
              <thead>
                <tr>
                  <th>{t('communities.col.name')}</th>
                  <th className={cell.hideSm}>{t('communities.col.kind')}</th>
                  <th className={`${cell.num} ${cell.hideSm}`}>{t('communities.col.members')}</th>
                  <th className={`${cell.num} ${cell.hideSm}`}>{t('communities.col.questions')}</th>
                  <th className={cell.hideSm}>{t('communities.col.referents')}</th>
                  <th>{t('communities.col.status')}</th>
                  <th className={cell.right}>{t('communities.col.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {d.items.map((c) => (
                  <tr key={c.slug}>
                    <td>
                      <span className={cell.title}>{c.name}</span>
                      <small className={cell.muted}>{c.countryCode ?? c.tag ?? c.slug}</small>
                    </td>
                    <td className={cell.hideSm}>
                      <Pill>{t(`communityKind.${c.kind}`)}</Pill>
                    </td>
                    <td className={`${cell.num} ${cell.hideSm}`}>{c.memberCount}</td>
                    <td className={`${cell.num} ${cell.hideSm}`}>{c.questionCount}</td>
                    <td className={cell.hideSm}>
                      {c.referents.length ? (
                        c.referents.map((r) => r.displayName).join(', ')
                      ) : (
                        <span className={cell.muted}>{t('communities.noReferent')}</span>
                      )}
                    </td>
                    <td>
                      <Status tone={c.status === 'OPEN' ? 'good' : 'neutral'}>
                        {t(`communityStatus.${c.status}`)}
                      </Status>
                    </td>
                    <td>
                      <div className={cell.rowActions}>
                        <Button size="sm" variant="ghost" onClick={() => setReferents(c)}>
                          {t('communities.referents')}
                        </Button>
                        {c.status === 'OPEN' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              run(
                                () => adminApi.closeCommunity(c.slug),
                                t('communities.closed', { name: c.name }),
                              )
                            }
                          >
                            {t('communities.close')}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              run(
                                () => adminApi.reopenCommunity(c.slug),
                                t('communities.reopened', { name: c.name }),
                              )
                            }
                          >
                            {t('communities.reopen')}
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

      <Dialog
        open={creating}
        title={t('communities.createTitle')}
        onClose={() => setCreating(false)}
      >
        {creating && (
          <CreateForm
            onClose={() => setCreating(false)}
            onCreated={(name) => {
              setCreating(false)
              notify(t('communities.created', { name }))
              query.reload()
            }}
          />
        )}
      </Dialog>
      <Dialog
        open={referents !== null}
        title={t('communities.referentsTitle')}
        onClose={() => setReferents(null)}
      >
        {referents && (
          <ReferentsForm
            community={referents}
            onClose={() => setReferents(null)}
            onSaved={() => {
              setReferents(null)
              notify(t('communities.referentsSaved'))
              query.reload()
            }}
          />
        )}
      </Dialog>
    </>
  )
}

function CreateForm({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (name: string) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<CommunityRequest['kind']>('TECH')
  const [place, setPlace] = useState('')
  const [description, setDescription] = useState('')
  const [rules, setRules] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState('')

  const errors = {
    name:
      name.trim().length < 3 || name.trim().length > 40 ? t('communities.errors.name') : undefined,
    place:
      kind === 'COUNTRY'
        ? /^[A-Za-z]{2}$/.test(place.trim())
          ? undefined
          : t('communities.errors.country')
        : place.trim()
          ? undefined
          : t('communities.errors.tag'),
    description:
      description.trim().length < 30 || description.trim().length > 200
        ? t('communities.errors.description')
        : undefined,
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    setAlert('')
    if (Object.values(errors).some(Boolean)) return
    setBusy(true)
    try {
      await adminApi.createCommunity({
        name: name.trim(),
        kind,
        countryCode: kind === 'COUNTRY' ? place.trim().toUpperCase() : undefined,
        tag: kind === 'TECH' ? place.trim().toLowerCase() : undefined,
        description: description.trim(),
        rules: rules
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean),
      })
      onCreated(name.trim())
    } catch (error) {
      setAlert(errorMessage(t, error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <DialogBody onSubmit={submit}>
      {alert && (
        <p role="alert" className={styles.alert}>
          {alert}
        </p>
      )}
      <Field label={t('communities.field.name')} error={submitted ? errors.name : undefined}>
        {(control) => (
          <input
            {...control}
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}
      </Field>
      <Field label={t('communities.field.kind')} select>
        {(control) => (
          <select
            {...control}
            value={kind}
            onChange={(event) => setKind(event.target.value as typeof kind)}
          >
            <option value="TECH">{t('communityKind.TECH')}</option>
            <option value="COUNTRY">{t('communityKind.COUNTRY')}</option>
          </select>
        )}
      </Field>
      <Field
        label={kind === 'COUNTRY' ? t('communities.field.country') : t('communities.field.tag')}
        hint={
          kind === 'COUNTRY' ? t('communities.field.countryHint') : t('communities.field.tagHint')
        }
        error={submitted ? errors.place : undefined}
      >
        {(control) => (
          <input
            {...control}
            maxLength={30}
            value={place}
            onChange={(event) => setPlace(event.target.value)}
          />
        )}
      </Field>
      <Field
        label={t('communities.field.description')}
        error={submitted ? errors.description : undefined}
      >
        {(control) => (
          <textarea
            {...control}
            maxLength={200}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        )}
      </Field>
      <Field label={t('communities.field.rules')} hint={t('communities.field.rulesHint')}>
        {(control) => (
          <textarea {...control} value={rules} onChange={(event) => setRules(event.target.value)} />
        )}
      </Field>
      <DialogFoot>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={busy}>
          {t('communities.create')}
        </Button>
      </DialogFoot>
    </DialogBody>
  )
}

function ReferentsForm({
  community,
  onClose,
  onSaved,
}: {
  community: AdminCommunity
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [value, setValue] = useState(community.referents.map((r) => r.username).join(', '))
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setAlert('')
    try {
      const usernames = value
        .split(/[,\s]+/)
        .map((u) => u.trim().replace(/^@/, ''))
        .filter(Boolean)
      await adminApi.setReferents(community.slug, usernames)
      onSaved()
    } catch (error) {
      setAlert(errorMessage(t, error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <DialogBody onSubmit={submit}>
      <DialogLead>{t('communities.referentsLead', { name: community.name })}</DialogLead>
      {alert && (
        <p role="alert" className={styles.alert}>
          {alert}
        </p>
      )}
      <Field label={t('communities.field.usernames')} hint={t('communities.field.usernamesHint')}>
        {(control) => (
          <textarea {...control} value={value} onChange={(event) => setValue(event.target.value)} />
        )}
      </Field>
      <DialogFoot>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={busy}>
          {t('common.save')}
        </Button>
      </DialogFoot>
    </DialogBody>
  )
}

function ProposalList() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const notify = useToast()
  const counts = useCounts()
  const [status, setStatus] = useState<ProposalTab>('PENDING')
  const [rejecting, setRejecting] = useState<AdminCommunityProposal | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const query = useQuery(
    (signal) => adminApi.listProposals({ status, size: 50 }, { signal }),
    [status],
  )

  async function decide(
    item: AdminCommunityProposal,
    decision: 'APPROVE' | 'REJECT',
    reason?: string,
  ) {
    setBusyId(item.id)
    try {
      await adminApi.decideProposal(item.id, decision, reason)
      notify(
        decision === 'APPROVE'
          ? t('communities.approved', { name: item.name })
          : t('communities.rejected', { name: item.name }),
      )
      query.reload()
      counts.refresh()
    } catch (error) {
      notify(errorMessage(t, error))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <Filters>
        <Segmented<ProposalTab>
          label={t('communities.proposalStatus')}
          value={status}
          onChange={setStatus}
          options={(['PENDING', 'APPROVED', 'REJECTED'] as const).map((value) => ({
            value,
            label: t(`proposalStatus.${value}`),
          }))}
        />
      </Filters>
      <Panel>
        <QueryState
          query={query}
          isEmpty={(d) => d.items.length === 0}
          empty={<EmptyState title={t('communities.noProposals')} />}
        >
          {(d) =>
            d.items.map((p) => (
              <article key={p.id} className={styles.proposal}>
                <div>
                  <h2>{p.name}</h2>
                  <p className={styles.meta}>
                    {t('communities.proposedBy', {
                      name: p.proposer.displayName,
                      date: formatDate(p.createdAt, lang),
                      kind: t(`communityKind.${p.kind}`),
                    })}
                  </p>
                  <p>{p.description}</p>
                  {p.rules.length > 0 && (
                    <ul>
                      {p.rules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                  )}
                  {p.rejectionReason && (
                    <p className={styles.meta}>
                      <b>{t('communities.rejectionReason')}</b> {p.rejectionReason}
                    </p>
                  )}
                </div>
                {p.status === 'PENDING' && (
                  <div className={styles.acts}>
                    <Button
                      variant="primary"
                      busy={busyId === p.id}
                      onClick={() => decide(p, 'APPROVE')}
                    >
                      {t('communities.approve')}
                    </Button>
                    <Button variant="dangerLine" onClick={() => setRejecting(p)}>
                      {t('communities.reject')}
                    </Button>
                  </div>
                )}
              </article>
            ))
          }
        </QueryState>
      </Panel>
      <NoteDialog
        open={rejecting !== null}
        title={t('communities.rejectTitle')}
        lead={t('communities.rejectLead', { name: rejecting?.name })}
        label={t('communities.rejectReason')}
        minLength={10}
        submitLabel={t('communities.reject')}
        danger
        onClose={() => setRejecting(null)}
        onSubmit={async (reason) => {
          const item = rejecting
          setRejecting(null)
          if (item) await decide(item, 'REJECT', reason)
        }}
      />
    </>
  )
}
