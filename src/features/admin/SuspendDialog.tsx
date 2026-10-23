import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../../components/Button'
import Dialog, { DialogBody, DialogFoot, DialogLead } from '../../components/Dialog'
import Field from '../../components/Field'
import type { User } from './types'

export const DURATIONS = ['1d', '7d', '30d', 'permanent'] as const
export type Duration = (typeof DURATIONS)[number]

export type SuspendDialogProps = {
  user: User | null
  onClose: () => void
  onConfirm: (user: User, duration: Duration, reason: string) => void
}

const MIN_REASON = 20

export default function SuspendDialog({ user, onClose, onConfirm }: SuspendDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={user !== null} title={t('users.suspend.title')} onClose={onClose}>
      {user && <SuspendForm user={user} onClose={onClose} onConfirm={onConfirm} />}
    </Dialog>
  )
}

/** Monté à l'ouverture de la fenêtre seulement : l'état repart de zéro à chaque suspension. */
function SuspendForm({
  user,
  onClose,
  onConfirm,
}: {
  user: User
  onClose: () => void
  onConfirm: SuspendDialogProps['onConfirm']
}) {
  const { t } = useTranslation()
  const [duration, setDuration] = useState<Duration>('7d')
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)

  const error =
    touched && reason.trim().length < MIN_REASON
      ? t('users.suspend.reasonError', { count: MIN_REASON })
      : undefined

  function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (reason.trim().length < MIN_REASON) return
    onConfirm(user, duration, reason.trim())
  }

  return (
    <DialogBody onSubmit={submit}>
      <DialogLead>{t('users.suspend.lead', { name: user.name })}</DialogLead>
      <Field label={t('users.suspend.duration')} select>
        {(control) => (
          <select
            {...control}
            value={duration}
            onChange={(event) => setDuration(event.target.value as Duration)}
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {t(`users.durations.${d}`)}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label={t('users.suspend.reason')} hint={t('users.suspend.hint')} error={error}>
        {(control) => (
          <textarea
            {...control}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        )}
      </Field>
      <DialogFoot>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="danger">
          {t('users.suspend.submit')}
        </Button>
      </DialogFoot>
    </DialogBody>
  )
}
