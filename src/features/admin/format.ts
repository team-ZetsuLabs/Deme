import type { TFunction } from 'i18next'
import type { AuditDetail } from './types'

export const fmt = (n: number, lang: string) => n.toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR')

export function formatDate(
  value: number | string | Date,
  lang: string,
  options?: Intl.DateTimeFormatOptions,
) {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleDateString(
    lang === 'en' ? 'en-GB' : 'fr-FR',
    options ?? { day: '2-digit', month: '2-digit', year: 'numeric' },
  )
}

export function formatDayMonth(value: number | string, lang: string) {
  return formatDate(value, lang, { day: '2-digit', month: '2-digit' })
}

export function formatDateTime(value: number, lang: string) {
  const date = new Date(value)
  const time = date.toLocaleTimeString(lang === 'en' ? 'en-GB' : 'fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${formatDayMonth(value, lang)} ${time}`
}

/** « il y a 12 min », « hier »… à partir d'un instant. */
export function formatAgo(at: number, lang: string, now = Date.now()) {
  const rtf = new Intl.RelativeTimeFormat(lang === 'en' ? 'en' : 'fr', {
    numeric: 'auto',
    style: 'short',
  })
  const minutes = Math.max(1, Math.round((now - at) / 60_000))
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  return rtf.format(-Math.round(hours / 24), 'day')
}

export const daysAgoToTime = (daysAgo: number, now = Date.now()) => now - daysAgo * 86_400_000

/** Texte d'audit : clé de traduction, paramètres préfixés « t: » (à traduire) ou « d: » (date ISO). */
export function auditText(t: TFunction, lang: string, value: AuditDetail | undefined): string {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  const params: Record<string, string | number> = {}
  for (const [key, raw] of Object.entries(value.params ?? {})) {
    if (typeof raw === 'string' && raw.startsWith('t:')) params[key] = t(raw.slice(2))
    else if (typeof raw === 'string' && raw.startsWith('d:'))
      params[key] = formatDate(raw.slice(2), lang)
    else params[key] = raw
  }
  return t(`audit.detail.${value.key}`, params)
}
