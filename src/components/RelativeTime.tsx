import { useTranslation } from 'react-i18next';
import { formatDateTime, formatRelative } from '../i18n/formatRelative';

export type RelativeTimeProps = { iso: string };

/** « il y a 2 heures », avec la date complète dans l'élément <time>. */
export function RelativeTime({ iso }: RelativeTimeProps) {
  const { i18n } = useTranslation();
  return (
    <time dateTime={iso} title={formatDateTime(iso, i18n.language)}>
      {formatRelative(iso, i18n.language)}
    </time>
  );
}
