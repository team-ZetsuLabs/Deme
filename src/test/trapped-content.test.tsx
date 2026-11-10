import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '../i18n';
import type {
  AppNotification,
  JobSummary,
  MissionSummary,
  MyModeratedContent,
  QuestionSummary,
  ReceivedApplication,
} from '../api/types';
import { ToastProvider } from '../components/ToastProvider';
import { JobRow } from '../features/jobs/JobRow';
import { ReceivedApplications } from '../features/jobs/ReceivedApplications';
import { MissionRow } from '../features/missions/MissionRow';
import { HiddenNotice } from '../features/moderation/HiddenNotice';
import { NotificationItem } from '../features/notifications/NotificationItem';
import { QuestionRow } from '../features/questions/QuestionRow';
import { author, publicProfile } from './fixtures';

/**
 * Contenus piégés (CLAUDE.md, « Tests et qualité ») : chaque texte écrit par un membre reçoit
 * les deux charges classiques. React doit les afficher comme du texte, sans rien exécuter.
 */
const SCRIPT = '<script>alert(1)</script>';
const IMG = '<img src=x onerror=alert(1)>';
const PAYLOADS = [SCRIPT, IMG];

const evil = (payload: string) => author({ displayName: payload, username: 'piege' });

const wrap = (ui: ReactNode) =>
  render(
    <MemoryRouter>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>,
  );

/** Aucune balise injectée dans le document, et le texte piégé est visible tel quel. */
function expectInert(payload: string) {
  expect(document.querySelector('script')).toBeNull();
  expect(document.querySelector('img[onerror]')).toBeNull();
  expect(document.querySelector('img[src="x"]')).toBeNull();
  expect(screen.getAllByText((_, el) => el?.textContent === payload).length).toBeGreaterThan(0);
  expect(window.alert).not.toHaveBeenCalled();
}

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe.each(PAYLOADS)('contenu piégé %s', (payload) => {
  it('titre, extrait, étiquette et auteur d’une question', () => {
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const question: QuestionSummary = {
      id: 1,
      title: payload,
      excerpt: payload,
      tags: [payload],
      context: { countryCode: 'SN', mobileMoneyOperator: null, networkQuality: null },
      author: evil(payload),
      score: 0,
      answerCount: 0,
      hasAcceptedAnswer: false,
      createdAt: '2026-10-20T10:00:00Z',
    };
    wrap(<QuestionRow question={question} activeTag={null} onTag={() => undefined} />);
    expectInert(payload);
  });

  it('offre et mission', () => {
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const job: JobSummary = {
      id: 1,
      title: payload,
      companyName: payload,
      type: 'PERMANENT',
      technologies: [payload],
      compensation: payload,
      status: 'PUBLISHED',
      createdAt: '2026-10-20T10:00:00Z',
    };
    const mission: MissionSummary = {
      id: 2,
      title: payload,
      kind: 'OTHER',
      budget: { amount: 50000, currency: 'XOF' },
      durationDays: 3,
      technologies: [payload],
      author: evil(payload),
      status: 'OPEN',
      applicationCount: 0,
      createdAt: '2026-10-20T10:00:00Z',
    };
    wrap(
      <>
        <JobRow job={job} />
        <MissionRow mission={mission} />
      </>,
    );
    expectInert(payload);
  });

  it('candidature reçue : nom, message et technologies du candidat', async () => {
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const application: ReceivedApplication = {
      id: 9,
      target: { type: 'JOB', id: 1, title: payload },
      candidate: publicProfile({
        username: 'piege',
        displayName: payload,
        bio: payload,
        reputation: 1,
        level: 'NEWCOMER',
        visibleToRecruiters: true,
        technologies: [payload],
        createdAt: '2026-10-20T10:00:00Z',
      }),
      message: payload,
      hasCv: false,
      status: 'SENT',
      createdAt: '2026-10-20T10:00:00Z',
      updatedAt: '2026-10-20T10:00:00Z',
    };
    wrap(
      <ReceivedApplications
        labels="jobs.received"
        load={async () => ({ items: [application], page: 0, size: 20, total: 1 })}
      />,
    );
    expect(await screen.findByRole('link', { name: payload })).toBeTruthy();
    expectInert(payload);
  });

  it('notification et avis de masquage', () => {
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const notification: AppNotification = {
      id: 1,
      type: 'ANSWER_POSTED',
      read: false,
      actor: evil(payload),
      target: { type: 'QUESTION', id: 1, title: payload },
      createdAt: '2026-10-20T10:00:00Z',
    };
    const moderated: MyModeratedContent = {
      caseId: 3,
      target: { type: 'ANSWER', id: 4, title: payload, questionId: 1, author: evil(payload) },
      status: 'HIDDEN',
      decision: { action: 'HIDE', note: payload, byTeam: false, decidedAt: '2026-10-20T10:00:00Z' },
      canAppeal: true,
      updatedAt: '2026-10-20T10:00:00Z',
    };
    wrap(
      <ul>
        <NotificationItem notification={notification} onOpen={() => undefined} />
        <li>
          <HiddenNotice item={moderated} onAppealed={() => undefined} />
        </li>
      </ul>,
    );
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('img[onerror]')).toBeNull();
    expect(screen.getByRole('link', { name: payload })).toBeTruthy();
    expect(screen.getByRole('note').textContent).toContain(payload);
    expect(window.alert).not.toHaveBeenCalled();
  });
});
