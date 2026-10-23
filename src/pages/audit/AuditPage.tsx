import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Avatar from '../../components/Avatar'
import { cell, TableWrap, Who } from '../../components/DataTable'
import { compactSelectClass, selectClass } from '../../components/Field'
import { Filters, PageHead, Panel } from '../../components/Panel'
import { useAdminStore } from '../../features/admin/AdminStore'
import { auditText, formatDateTime } from '../../features/admin/format'
import { useCrumbs } from '../../layout/crumbs'
import utils from '../../styles/utils.module.css'

export default function AuditPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { audit, staff, staffBy } = useAdminStore()
  const [who, setWho] = useState('all')
  useCrumbs([{ label: t('shell.groups.system'), to: '/journal' }, { label: t('nav.audit') }])

  const list = audit.filter((entry) => who === 'all' || entry.who === who)

  return (
    <>
      <PageHead title={t('nav.audit')} description={t('audit.lead')} />
      <Filters>
        <label className={utils.srOnly} htmlFor="auditWho">
          {t('audit.member')}
        </label>
        <select
          id="auditWho"
          className={`${selectClass} ${compactSelectClass}`}
          value={who}
          onChange={(event) => setWho(event.target.value)}
        >
          <option value="all">{t('audit.allTeam')}</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Filters>
      <Panel>
        <TableWrap>
          <thead>
            <tr>
              <th>{t('audit.col.date')}</th>
              <th>{t('audit.col.member')}</th>
              <th>{t('audit.col.action')}</th>
              <th>{t('audit.col.target')}</th>
              <th className={cell.hideSm}>{t('audit.col.details')}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((entry) => {
              const member = staffBy(entry.who)
              return (
                <tr key={entry.id}>
                  <td
                    className={`${cell.mono} ${cell.muted}`}
                    style={{ fontSize: 13, whiteSpace: 'nowrap' }}
                  >
                    {formatDateTime(entry.at, lang)}
                  </td>
                  <td>
                    <Who avatar={<Avatar name={member.name} size={24} />} name={member.name} />
                  </td>
                  <td style={{ fontWeight: 500 }}>{t(`audit.action.${entry.action}`)}</td>
                  <td>{auditText(t, lang, entry.target)}</td>
                  <td className={`${cell.hideSm} ${cell.muted}`}>
                    {auditText(t, lang, entry.detail)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  )
}
