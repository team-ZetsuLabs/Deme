import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Button from './Button'
import Dialog, { DialogBody, DialogFoot, DialogLead } from './Dialog'
import Field from './Field'

export type NoteDialogProps = {
  open: boolean
  title: string
  lead?: string
  label: string
  hint?: string
  placeholder?: string
  initial?: string
  minLength: number
  maxLength?: number
  submitLabel: string
  danger?: boolean
  onClose: () => void
  onSubmit: (note: string) => void | Promise<void>
}

/** Fenêtre « motif obligatoire » (avertir, masquer, suspendre, refuser). Le formulaire est monté à l'ouverture. */
export default function NoteDialog(props: NoteDialogProps) {
  return (
    <Dialog open={props.open} title={props.title} onClose={props.onClose}>
      {props.open && <NoteForm {...props} />}
    </Dialog>
  )
}

function NoteForm({
  lead,
  label,
  hint,
  placeholder,
  initial = '',
  minLength,
  maxLength = 500,
  submitLabel,
  danger,
  onClose,
  onSubmit,
}: NoteDialogProps) {
  const { t } = useTranslation()
  const [note, setNote] = useState(initial)
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const short = note.trim().length < minLength
  const error = touched && short ? t('common.noteTooShort', { count: minLength }) : undefined

  async function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (short) return
    setBusy(true)
    try {
      await onSubmit(note.trim())
    } finally {
      setBusy(false)
    }
  }

  return (
    <DialogBody onSubmit={submit}>
      {lead && <DialogLead>{lead}</DialogLead>}
      <Field label={label} hint={hint} error={error}>
        {(control) => (
          <textarea
            {...control}
            maxLength={maxLength}
            placeholder={placeholder}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        )}
      </Field>
      <DialogFoot>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant={danger ? 'danger' : 'primary'} busy={busy}>
          {submitLabel}
        </Button>
      </DialogFoot>
    </DialogBody>
  )
}
