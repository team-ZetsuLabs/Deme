import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import styles from './Pagination.module.css';

export type PaginationProps = {
  /** Page courante, à partir de 0 comme l'API. */
  page: number;
  size: number;
  total: number;
  onChange: (page: number) => void;
};

/** Page précédente et suivante : simple et léger, adapté au mobile. */
export function Pagination({ page, size, total, onChange }: PaginationProps) {
  const { t } = useTranslation();
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label={t('common.pagination.label')}>
      <Button size="sm" disabled={page <= 0} onClick={() => onChange(page - 1)}>
        {t('common.pagination.prev')}
      </Button>
      <span className={styles.status}>
        {t('common.pagination.status', { page: page + 1, pages })}
      </span>
      <Button size="sm" disabled={page >= pages - 1} onClick={() => onChange(page + 1)}>
        {t('common.pagination.next')}
      </Button>
    </nav>
  );
}
