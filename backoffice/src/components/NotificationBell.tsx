import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { notificationApi } from '../api/endpoints'
import { errorMessage } from '../api/errorMessage'
import type { Notification } from '../api/types'
import { useQuery } from '../api/useQuery'
import { destinationOf } from '../features/notifications/destination'
import { formatAgo } from '../features/admin/format'
import Button from './Button'
import Icon from './Icon'
import styles from './NotificationBell.module.css'

const POLL_MS = 60_000

/** Nombre de non-lues : une requête minuscule toutes les 60 s, seulement onglet visible (réseau 3G). */
function useUnreadCount() {
  const [count, setCount] = useState(0)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const run = () =>
      notificationApi
        .unreadCount({ signal: controller.signal })
        .then((result) => setCount(result.count))
        .catch(() => {
          // le compteur garde sa dernière valeur ; la liste affichera l'erreur si besoin
        })
    run()
    const tick = () => {
      if (document.visibilityState === 'visible') run()
    }
    const timer = setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      controller.abort()
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [version])

  return { count, setCount, refresh: () => setVersion((v) => v + 1) }
}

export default function NotificationBell() {
  const { t } = useTranslation()
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { count, setCount, refresh } = useUnreadCount()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  const label = count > 0 ? t('notifications.bellUnread', { count }) : t('notifications.bell')

  return (
    <div className={styles.root} ref={rootRef}>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className={styles.bell}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (!open) refresh()
          setOpen((value) => !value)
        }}
      >
        <Icon name="bell" size={18} />
        {count > 0 && <span className={styles.badge}>{count > 99 ? '99+' : count}</span>}
      </Button>
      {open && (
        <Panel id={panelId} count={count} onCount={setCount} onClose={() => setOpen(false)} />
      )}
    </div>
  )
}

type PanelProps = {
  id: string
  count: number
  onCount: (count: number) => void
  onClose: () => void
}

/** Monté à l'ouverture seulement : la liste est chargée à ce moment-là, pas en arrière-plan. */
function Panel({ id, count, onCount, onClose }: PanelProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const query = useQuery((signal) => notificationApi.list({ signal }), [])

  async function markRead(ids?: number[]) {
    try {
      const result = await notificationApi.markRead(ids)
      onCount(result.count)
      query.reload()
    } catch (e) {
      setError(errorMessage(t, e))
    }
  }

  function open(notification: Notification) {
    if (!notification.read) void markRead([notification.id])
    const destination = destinationOf(notification)
    if (destination) {
      onClose()
      navigate(destination)
    }
  }

  const items = query.data?.items
  const failure = error || (query.error && !items ? errorMessage(t, query.error) : '')

  return (
    <div id={id} className={styles.panel} role="dialog" aria-label={t('notifications.title')}>
      <div className={styles.head}>
        <h2>{t('notifications.title')}</h2>
        <Button size="sm" variant="ghost" disabled={count === 0} onClick={() => markRead()}>
          {t('notifications.markAll')}
        </Button>
      </div>
      <div className={styles.body}>
        {failure && (
          <p role="alert" className={styles.state}>
            {failure}{' '}
            <button
              type="button"
              className={styles.retry}
              onClick={() => {
                setError('')
                query.reload()
              }}
            >
              {t('common.retry')}
            </button>
          </p>
        )}
        {!failure && !items && <p className={styles.state}>{t('common.loading')}</p>}
        {!failure && items && items.length === 0 && (
          <p className={styles.state}>{t('notifications.empty')}</p>
        )}
        {items && items.length > 0 && (
          <ul className={styles.list}>
            {items.map((n) => {
              const text = t(`notifications.type.${n.type}`, {
                actor: n.actor?.displayName ?? t('notifications.someone'),
                title: n.target.title,
              })
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    className={styles.item}
                    data-unread={!n.read}
                    onClick={() => open(n)}
                  >
                    <span className={styles.dot} aria-hidden="true" />
                    <span className={styles.text}>
                      {!n.read && <span className={styles.sr}>{t('notifications.unread')} </span>}
                      {text}
                      <small>{formatAgo(n.createdAt, lang)}</small>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
