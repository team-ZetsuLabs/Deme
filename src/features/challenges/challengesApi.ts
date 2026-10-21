import { api } from '../../api/api';
import type {
  Challenge,
  LeaderboardEntry,
  Submission,
  SubmissionRequest,
} from '../../api/provisional-types';

export const challengesApi = {
  current: () => api.get<Challenge>('/challenges/current'),
  leaderboard: (id: number) => api.get<LeaderboardEntry[]>(`/challenges/${id}/leaderboard`),
  submit: (id: number, body: SubmissionRequest) =>
    api.post<Submission>(`/challenges/${id}/submissions`, body),
};

// Dépôt public GitHub : https://github.com/compte/depot, sans chemin supplémentaire (CH-2).
const REPO_PATTERN = /^https:\/\/github\.com\/[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}\/?$/;

export function validateRepoUrl(value: string): string | null {
  return REPO_PATTERN.test(value.trim()) ? null : 'challenges.submit.badUrl';
}
