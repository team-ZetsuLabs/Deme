import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Button from './Button'
import Dialog, { DialogBody, DialogFoot, DialogLead } from './Dialog'

export type ConfirmOptions = {
  title: string
  text: string
  okLabel: string
  danger?: boolean
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void }
type Confirm = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<Confirm | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [pending, setPending] = useState<Pending | null>(null)

  const confirm = useCallback<Confirm>(
    (options) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  )
  const value = useMemo(() => confirm, [confirm])

  function done(ok: boolean) {
    pending?.resolve(ok)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog open={pending !== null} title={pending?.title ?? ''} onClose={() => done(false)}>
        <DialogBody>
          <DialogLead>{pending?.text}</DialogLead>
          <DialogFoot>
            <Button onClick={() => done(false)}>{t('common.cancel')}</Button>
            <Button variant={pending?.danger ? 'danger' : 'primary'} onClick={() => done(true)}>
              {pending?.okLabel}
            </Button>
          </DialogFoot>
        </DialogBody>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): Confirm {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm doit être utilisé dans ConfirmProvider')
  return ctx
}
