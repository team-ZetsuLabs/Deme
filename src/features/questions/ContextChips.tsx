import { useTranslation } from 'react-i18next';
import type { QuestionContext } from '../../api/provisional-types';
import { Icon } from '../../components/Icon';
import { countryName } from '../../i18n/countries';
import styles from './ContextChips.module.css';

export type ContextChipsProps = { context: QuestionContext };

/** Contexte africain d'une question (QA-2) : pays, opérateur, réseau, version. */
export function ContextChips({ context }: ContextChipsProps) {
  const { t, i18n } = useTranslation();
  const country = countryName(context.country, i18n.language);
  const chips = [
    country && { key: 'country', label: country, icon: true },
    context.operator && { key: 'operator', label: t(`context.operator.${context.operator}`) },
    context.network && { key: 'network', label: t(`context.network.${context.network}`) },
    context.techVersion && { key: 'version', label: context.techVersion, mono: true },
  ].filter(Boolean) as { key: string; label: string; icon?: boolean; mono?: boolean }[];

  if (!chips.length) return null;
  return (
    <ul className={styles.chips} aria-label={t('context.label')}>
      {chips.map((chip) => (
        <li key={chip.key} className={chip.mono ? `${styles.chip} ${styles.mono}` : styles.chip}>
          {chip.icon && <Icon name="pin" size={13} />}
          {chip.label}
        </li>
      ))}
    </ul>
  );
}
