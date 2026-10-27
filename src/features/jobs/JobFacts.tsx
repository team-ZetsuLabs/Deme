import { useTranslation } from 'react-i18next';
import type { JobSummary } from '../../api/types';
import { Icon } from '../../components/Icon';
import { countryName } from '../../i18n/countries';
import styles from './JobFacts.module.css';

export type JobFactsProps = { job: JobSummary; extra?: (string | null)[] };

/** Type de poste, lieu et rémunération, en étiquettes. */
export function JobFacts({ job, extra = [] }: JobFactsProps) {
  const { t, i18n } = useTranslation();
  const place = [job.city, countryName(job.countryCode ?? null, i18n.language)]
    .filter(Boolean)
    .join(', ');
  const facts = [t(`jobs.contract.${job.type}`), job.compensation, ...extra].filter(
    Boolean,
  ) as string[];

  return (
    <ul className={styles.facts}>
      {place && (
        <li className={styles.place}>
          <Icon name="pin" size={13} />
          {place}
        </li>
      )}
      {facts.map((fact) => (
        <li key={fact} className={styles.chip}>
          {fact}
        </li>
      ))}
    </ul>
  );
}
