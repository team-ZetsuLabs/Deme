import type {
  JobSummary,
  MissionSummary,
  PlaytestSummary,
  ProjectSummary,
  QuestionSummary,
} from '../../api/types';

/** Un élément du flux unifié, quel que soit son espace d'origine (TST, QA, JOB…). */
export type FeedEntry =
  | { kind: 'question'; key: string; at: string; item: QuestionSummary }
  | { kind: 'job'; key: string; at: string; item: JobSummary }
  | { kind: 'mission'; key: string; at: string; item: MissionSummary }
  | { kind: 'project'; key: string; at: string; item: ProjectSummary }
  | { kind: 'playtest'; key: string; at: string; item: PlaytestSummary };

export type FeedSources = {
  questions?: QuestionSummary[];
  jobs?: JobSummary[];
  missions?: MissionSummary[];
  projects?: ProjectSummary[];
  playtests?: PlaytestSummary[];
};

/**
 * Mélange déterministe (même ordre à données égales, donc aucun saut au re-render) mais
 * d'apparence aléatoire. La graine vient du nombre d'éléments : le fil ne dépend plus de la
 * date, donc il n'affiche plus « un espace puis un autre » mais un vrai mélange.
 */
function shuffle(entries: FeedEntry[]): FeedEntry[] {
  const a = entries.slice();
  let seed = (a.length * 2654435761) & 0x7fffffff || 1;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fusionne tous les espaces en un seul flux mélangé (comme un fil social, pas section par section). */
export function mergeFeed(sources: FeedSources): FeedEntry[] {
  const entries: FeedEntry[] = [
    ...(sources.questions ?? []).map((item): FeedEntry => ({
      kind: 'question',
      key: `q${item.id}`,
      at: item.createdAt,
      item,
    })),
    ...(sources.jobs ?? []).map((item): FeedEntry => ({
      kind: 'job',
      key: `j${item.id}`,
      at: item.createdAt,
      item,
    })),
    ...(sources.missions ?? []).map((item): FeedEntry => ({
      kind: 'mission',
      key: `m${item.id}`,
      at: item.createdAt,
      item,
    })),
    ...(sources.projects ?? []).map((item): FeedEntry => ({
      kind: 'project',
      key: `p${item.id}`,
      at: item.createdAt,
      item,
    })),
    ...(sources.playtests ?? []).map((item): FeedEntry => ({
      kind: 'playtest',
      key: `t${item.id}`,
      at: item.createdAt,
      item,
    })),
  ];
  return shuffle(entries);
}
