import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { JobSummary } from '../../api/provisional-types';
import { Avatar } from '../../components/Avatar';
import { buttonClass } from '../../components/buttonClass';
import { RelativeTime } from '../../components/RelativeTime';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { JobFacts } from './JobFacts';
import styles from './JobRow.module.css';

export type JobRowProps = { job: JobSummary };

export function JobRow({ job }: JobRowProps) {
  const { t } = useTranslation();
  return (
    <article className={styles.row}>
      <Avatar name={job.company.name} photoUrl={job.company.logoUrl} size={44} square />
      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link to={`/jobs/${job.id}`}>{job.title}</Link>
        </h3>
        <p className={styles.company}>
          {job.company.name}
          <span aria-hidden="true"> · </span>
          <RelativeTime iso={job.createdAt} />
        </p>
        <JobFacts job={job} />
        <ul className={styles.tags}>
          {job.technologies.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      </div>
      <div className={styles.action}>
        {job.myApplication ? (
          <ApplicationStatusBadge status={job.myApplication} />
        ) : (
          <Link
            to={`/jobs/${job.id}`}
            className={buttonClass({ size: 'sm' })}
            aria-label={t('jobs.viewLabel', { title: job.title })}
          >
            {t('jobs.view')}
          </Link>
        )}
      </div>
    </article>
  );
}
