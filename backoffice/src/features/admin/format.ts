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

export function formatDateTime(value: number | string, lang: string) {
  const date = new Date(value)
  const time = date.toLocaleTimeString(lang === 'en' ? 'en-GB' : 'fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${formatDate(date, lang, { day: '2-digit', month: '2-digit' })} ${time}`
}

/** « il y a 12 min », « hier »… à partir d'un instant ISO ou en millisecondes. */
export function formatAgo(at: number | string, lang: string, now = Date.now()) {
  const rtf = new Intl.RelativeTimeFormat(lang === 'en' ? 'en' : 'fr', {
    numeric: 'auto',
    style: 'short',
  })
  const minutes = Math.max(1, Math.round((now - new Date(at).getTime()) / 60_000))
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  return rtf.format(-Math.round(hours / 24), 'day')
}
