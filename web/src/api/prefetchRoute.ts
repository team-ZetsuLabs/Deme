import { authApi } from '../features/auth/authApi';
import { jobsApi } from '../features/jobs/jobsApi';
import { parseJobFilters } from '../features/jobs/useJobFilters';
import { missionsApi } from '../features/missions/missionsApi';
import { parseMissionFilters } from '../features/missions/useMissionFilters';
import { questionsApi } from '../features/questions/questionsApi';
import { parseQuestionFilters } from '../features/questions/useQuestionFilters';
import { api } from './api';

/**
 * Au démarrage, lance la session et les données principales de la page demandée, en même
 * temps que le téléchargement du code de cette page (au lieu d'après). En 3G, c'est un
 * aller-retour de moins avant l'affichage du contenu. Les pages font ensuite les mêmes
 * appels et reprennent ces requêtes (voir api.prefetch).
 */
export function prefetchRoute(pathname: string, search: string) {
  const params = new URLSearchParams(search);
  const [, section, rawId, extra] = pathname.split('/');
  const id = Number(rawId);
  const detail = Number.isInteger(id) && id > 0 && extra === undefined;

  api.prefetch(() => {
    void authApi.me();
    if (section === 'questions' && rawId === undefined) {
      void questionsApi.list(parseQuestionFilters(params));
    } else if (section === 'questions' && detail) {
      void questionsApi.get(id);
      void questionsApi.answers(id);
    } else if (section === 'jobs' && rawId === undefined) {
      void jobsApi.list(parseJobFilters(params));
    } else if (section === 'jobs' && detail) {
      void jobsApi.get(id);
    } else if (section === 'missions' && rawId === undefined) {
      void missionsApi.list(parseMissionFilters(params));
    } else if (section === 'missions' && detail) {
      void missionsApi.get(id);
    }
  });
}
