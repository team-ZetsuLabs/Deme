import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { ErrorState } from '../../components/ErrorState';
import { Field } from '../../components/Field';
import { MemberContent } from '../../components/MemberContent';
import { Pagination } from '../../components/Pagination';
import { RelativeTime } from '../../components/RelativeTime';
import { ListRowsSkeleton } from '../../components/skeleton/ListRowsSkeleton';
import { StateMessage } from '../../components/StateMessage';
import { describedBy } from '../../components/fieldIds';
import { useToast } from '../../components/useToast';
import { useApiQuery } from '../../hooks/useApiQuery';
import { MemberLine } from './MemberLine';
import { projectsApi } from './projectsApi';
import { UPDATE_MAX, validateUpdate } from './validation';
import styles from './ProjectUpdates.module.css';

export type ProjectUpdatesProps = {
  projectId: number;
  /** L'équipe peut poster une mise à jour. */
  canPost: boolean;
};

/** Mises à jour d'un projet (PRJ) : fil des annonces de l'équipe et formulaire de publication. */
export function ProjectUpdates({ projectId, canPost }: ProjectUpdatesProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [body, setBody] = useState('');
  const [bodyErr, setBodyErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const query = useApiQuery(() => projectsApi.updates(projectId, page), [projectId, page]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validateUpdate(body);
    setBodyErr(problem ? t(problem) : null);
    if (problem) return;
    setBusy(true);
    try {
      const update = await projectsApi.postUpdate(projectId, { bodyMarkdown: body.trim() });
      setBody('');
      if (page === 0) {
        query.setData((current) => ({
          ...current,
          items: [update, ...current.items],
          total: current.total + 1,
        }));
      } else {
        setPage(0);
      }
      toast(t('projects.updates.posted'));
    } catch (error) {
      toast(errorMessage(t, error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrap}>
      {canPost && (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <Field
            id="project-update"
            label={t('projects.updates.label')}
            error={bodyErr}
            labelAside={
              <span className={styles.count} aria-hidden="true">
                {body.length}/{UPDATE_MAX}
              </span>
            }
          >
            <textarea
              id="project-update"
              rows={3}
              maxLength={UPDATE_MAX}
              value={body}
              placeholder={t('projects.updates.placeholder')}
              onChange={(e) => {
                setBody(e.target.value);
                if (bodyErr && !validateUpdate(e.target.value)) setBodyErr(null);
              }}
              aria-invalid={!!bodyErr}
              aria-describedby={describedBy('project-update', false, bodyErr)}
            />
          </Field>
          <div className={styles.formActions}>
            <Button type="submit" size="sm" variant="primary" busy={busy}>
              {t('projects.updates.post')}
            </Button>
          </div>
        </form>
      )}

      {query.loading && <ListRowsSkeleton count={2} />}
      {!query.loading && (query.error || !query.data) && (
        <ErrorState error={query.error} onRetry={query.reload} />
      )}
      {!query.loading && query.data && query.data.items.length === 0 && (
        <StateMessage>{t('projects.updates.empty')}</StateMessage>
      )}
      {!query.loading && query.data && query.data.items.length > 0 && (
        <>
          <ul className={styles.list}>
            {query.data.items.map((update) => (
              <li key={update.id} className={styles.item}>
                <div className={styles.meta}>
                  <MemberLine
                    member={update.author}
                    size={28}
                    sub={<RelativeTime iso={update.createdAt} />}
                  />
                </div>
                <MemberContent html={update.bodyHtml} className={styles.body} />
              </li>
            ))}
          </ul>
          <Pagination
            page={query.data.page}
            size={query.data.size}
            total={query.data.total}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
