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

/** Fusionne les espaces en un seul flux, du plus récent au plus ancien (comme un fil social). */
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
  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
