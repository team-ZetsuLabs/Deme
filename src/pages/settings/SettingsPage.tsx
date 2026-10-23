import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import { useConfirm } from '../../components/ConfirmProvider'
import { cell, TableWrap, Who } from '../../components/DataTable'
import Field, { selectClass, compactSelectClass, SwitchRow, Toggle } from '../../components/Field'
import { PageHead, Panel, PanelBody, PanelHead, SaveBar, Stack } from '../../components/Panel'
import { useToast } from '../../components/ToastProvider'
import { useAdminStore } from '../../features/admin/AdminStore'
import type { Settings, StaffMember, StaffRole } from '../../features/admin/types'
import { useCrumbs } from '../../layout/crumbs'
import utils from '../../styles/utils.module.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function SettingsPage() {
  const { t } = useTranslation()
  const store = useAdminStore()
  const notify = useToast()
  const confirm = useConfirm()
  useCrumbs([{ label: t('shell.groups.system'), to: '/journal' }, { label: t('nav.settings') }])

  async function revoke(member: StaffMember) {
    const ok = await confirm({
      title: t('settings.revoke.title'),
      text: t('settings.revoke.text', { name: member.name }),
      okLabel: t('settings.revoke.title'),
      danger: true,
    })
    if (!ok) return
    store.revokeStaff(member.id)
    notify(t('settings.revoke.done', { name: member.name }))
  }

  async function toggle2fa(checked: boolean) {
    if (!checked) {
      const ok = await confirm({
        title: t('settings.twoFactor.disableTitle'),
        text: t('settings.twoFactor.disableText'),
        okLabel: t('settings.twoFactor.disableOk'),
        danger: true,
      })
      if (!ok) return
    }
    store.updateSettings({ require2fa: checked })
    notify(checked ? t('settings.twoFactor.on') : t('settings.twoFactor.off'))
  }

  return (
    <>
      <PageHead title={t('nav.settings')} description={t('settings.lead')} />
      <Stack>
        <Panel>
          <PanelHead
            title={t('settings.team.title')}
            description={t('settings.team.count', { count: store.staff.length })}
          />
          <TableWrap>
            <thead>
              <tr>
                <th>{t('settings.team.member')}</th>
                <th>{t('settings.team.role')}</th>
                <th className={cell.hideSm}>{t('settings.team.lastSeen')}</th>
                <th className={cell.right}>
                  <span className={utils.srOnly}>{t('contents.col.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {store.staff.map((member) => (
                <tr key={member.id}>
                  <td>
                    <Who
                      avatar={<Avatar name={member.name} size={30} />}
                      name={
                        member.id === store.currentAdmin.id
                          ? `${member.name} ${t('settings.team.you')}`
                          : member.name
                      }
                      sub={member.email}
                    />
                  </td>
                  <td>{t(`settings.roles.${member.role}`)}</td>
                  <td className={`${cell.hideSm} ${cell.muted}`}>
                    {member.lastSeen.kind === 'online'
                      ? t('settings.team.online')
                      : t(`settings.team.ago.${member.lastSeen.kind}`, {
                          count: member.lastSeen.value,
                        })}
                  </td>
                  <td className={cell.right}>
                    {member.id !== store.currentAdmin.id && (
                      <Button size="sm" variant="ghost" onClick={() => revoke(member)}>
                        {t('settings.team.revoke')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <InviteForm />
        </Panel>

        <RulesForm settings={store.settings} />

        <Panel>
          <PanelHead
            title={t('settings.security.title')}
            description={t('settings.security.lead')}
          />
          <PanelBody>
            <SwitchRow
              title={t('settings.twoFactor.title')}
              description={t('settings.twoFactor.hint')}
            >
              <Toggle
                label={t('settings.twoFactor.title')}
                checked={store.settings.require2fa}
                onChange={toggle2fa}
              />
            </SwitchRow>
            <SwitchRow title={t('settings.session.title')} description={t('settings.session.hint')}>
              <label className={utils.srOnly} htmlFor="sessSel">
                {t('settings.session.duration')}
              </label>
              <select
                id="sessSel"
                className={`${selectClass} ${compactSelectClass}`}
                value={store.settings.session}
                onChange={(event) => {
                  const session = event.target.value as Settings['session']
                  store.updateSettings({ session })
                  notify(
                    t('settings.session.done', {
                      duration: t(`settings.session.options.${session}`),
                    }),
                  )
                }}
              >
                {(['1h', '8h', '24h'] as const).map((s) => (
                  <option key={s} value={s}>
                    {t(`settings.session.options.${s}`)}
                  </option>
                ))}
              </select>
            </SwitchRow>
          </PanelBody>
        </Panel>
      </Stack>
    </>
  )
}

function InviteForm() {
  const { t } = useTranslation()
  const { inviteStaff } = useAdminStore()
  const notify = useToast()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<StaffRole>('moderator')
  const [submitted, setSubmitted] = useState(false)
  const error =
    submitted && !EMAIL_PATTERN.test(email.trim()) ? t('settings.invite.error') : undefined

  function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (!EMAIL_PATTERN.test(email.trim())) return
    inviteStaff(email.trim(), role)
    notify(t('settings.invite.done', { email: email.trim() }))
    setEmail('')
    setSubmitted(false)
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      style={{
        borderTop: '1px solid var(--line)',
        padding: 24,
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'flex-start',
      }}
    >
      <Field
        label={t('settings.invite.label')}
        error={error}
        style={{ margin: 0, flex: 1, minWidth: 220 }}
      >
        {(control) => (
          <input
            {...control}
            type="email"
            placeholder="prenom@zetsu.dev"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}
      </Field>
      <Field label={t('settings.team.role')} select style={{ margin: 0 }}>
        {(control) => (
          <select
            {...control}
            value={role}
            onChange={(event) => setRole(event.target.value as StaffRole)}
          >
            <option value="moderator">{t('settings.roles.moderator')}</option>
            <option value="administrator">{t('settings.roles.administrator')}</option>
          </select>
        )}
      </Field>
      <Button type="submit" variant="primary" style={{ marginTop: 27 }}>
        {t('settings.invite.submit')}
      </Button>
    </form>
  )
}

function RulesForm({ settings }: { settings: Settings }) {
  const { t } = useTranslation()
  const { updateSettings } = useAdminStore()
  const notify = useToast()
  const [autoHide, setAutoHide] = useState(String(settings.autoHide))
  const [banned, setBanned] = useState(settings.banned)
  const [manualJobs, setManualJobs] = useState(settings.manualJobs)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const n = Number(autoHide)
  const error =
    submitted && !(Number.isInteger(n) && n >= 2 && n <= 20) ? t('settings.rules.error') : undefined

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (!(Number.isInteger(n) && n >= 2 && n <= 20)) return
    setBusy(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setBusy(false)
    updateSettings({ autoHide: n, banned, manualJobs })
    notify(t('settings.rules.saved'))
  }

  return (
    <Panel as="form" onSubmit={submit} noValidate>
      <PanelHead title={t('settings.rules.title')} description={t('settings.rules.lead')} />
      <PanelBody>
        <Field label={t('settings.rules.autoHide')} error={error} style={{ maxWidth: 320 }}>
          {(control) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                {...control}
                type="number"
                min={2}
                max={20}
                style={{ width: 90 }}
                value={autoHide}
                onChange={(event) => setAutoHide(event.target.value)}
              />
              <span style={{ color: 'var(--text-3)' }}>{t('settings.rules.reports')}</span>
            </div>
          )}
        </Field>
        <Field label={t('settings.rules.banned')} hint={t('settings.rules.bannedHint')}>
          {(control) => (
            <textarea
              {...control}
              style={{ minHeight: 80 }}
              value={banned}
              onChange={(event) => setBanned(event.target.value)}
            />
          )}
        </Field>
        <SwitchRow title={t('settings.rules.manual')} description={t('settings.rules.manualHint')}>
          <Toggle
            label={t('settings.rules.manual')}
            checked={manualJobs}
            onChange={setManualJobs}
          />
        </SwitchRow>
      </PanelBody>
      <SaveBar>
        <Button type="submit" variant="primary" busy={busy}>
          {busy ? t('settings.rules.saving') : t('settings.rules.save')}
        </Button>
      </SaveBar>
    </Panel>
  )
}
