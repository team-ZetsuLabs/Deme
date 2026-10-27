import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '../../i18n';
import type { Me, MissionDetail, ReceivedApplication } from '../../api/types';
import { ToastProvider } from '../../components/ToastProvider';
import MissionPage from '../../pages/mission/MissionPage';
import MissionsPage from '../../pages/missions/MissionsPage';
import { authApi } from '../auth/authApi';
import { jobsApi } from '../jobs/jobsApi';
import { SessionProvider } from '../auth/SessionProvider';
import { MissionForm } from './MissionForm';
import { missionsApi } from './missionsApi';
import { formatMoney } from './money';
import { author, demoMe } from '../../test/fixtures';

const member: Me = demoMe({ technologies: ['php', 'mobile-money'] });

const wrap = (ui: ReactNode, path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <ToastProvider>{ui}</ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );

const renderMission = () =>
  wrap(
    <Routes>
      <Route path="/missions/:id" element={<MissionPage />} />
    </Routes>,
    '/missions/1',
  );

const type = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('formatMoney', () => {
  it('affiche un budget en francs CFA sans décimales', () => {
    const text = formatMoney({ amount: 75000, currency: 'XOF' }, 'fr');
    expect(text.replace(/\s/g, ' ')).toMatch(/75 000/);
    expect(text).toMatch(/CFA/);
  });
});

describe('MissionPage (JOB-5)', () => {
  it('permet à un membre de se proposer', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    const offer = vi.spyOn(missionsApi, 'offer');
    renderMission();

    fireEvent.click(await screen.findByRole('button', { name: 'Se proposer' }));
    type(
      /^Votre message/,
      "J'ai intégré Wave sur deux boutiques WooCommerce à Dakar l'an dernier.",
    );
    type(/^Votre prix/, '70000');
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer ma proposition' }));

    await waitFor(() =>
      expect(offer).toHaveBeenCalledWith(14, {
        message: "J'ai intégré Wave sur deux boutiques WooCommerce à Dakar l'an dernier.",
        proposedBudget: { amount: 70000, currency: 'XOF' },
      }),
    );
    expect(await screen.findByText('Vous vous êtes proposé pour cette mission.')).toBeTruthy();
  });

  it("montre les propositions à l'auteur, qui peut en retenir une", async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    const detail: MissionDetail = {
      id: 1,
      title: 'Intégrer Wave dans une boutique WooCommerce',
      kind: 'INTEGRATION',
      budget: { amount: 75000, currency: 'XOF' },
      durationDays: 5,
      technologies: ['php'],
      author: author(),
      createdAt: '2026-10-21T10:30:00Z',
      updatedAt: '2026-10-21T10:30:00Z',
      status: 'OPEN',
      applicationCount: 1,
      myApplication: null,
      canEdit: true,
      descriptionMarkdown: 'Description',
      descriptionHtml: '<p>Description</p>',
    };
    const offer: ReceivedApplication = {
      id: 301,
      target: { type: 'MISSION', id: 1, title: detail.title },
      candidate: {
        username: 'moussa_t',
        displayName: 'Moussa Traoré',
        countryCode: 'ML',
        role: 'MEMBER',
        reputation: 310,
        level: 'MEMBER',
        visibleToRecruiters: false,
        technologies: ['php'],
        questionCount: 2,
        answerCount: 14,
        createdAt: '2026-09-01T08:00:00Z',
      },
      message: 'Je peux commencer demain.',
      hasCv: false,
      proposedBudget: { amount: 70000, currency: 'XOF' },
      status: 'SENT',
      createdAt: '2026-10-21T11:00:00Z',
      updatedAt: '2026-10-21T11:00:00Z',
    };
    vi.spyOn(missionsApi, 'get').mockResolvedValue(detail);
    vi.spyOn(missionsApi, 'applications').mockResolvedValue({
      items: [offer],
      page: 0,
      size: 20,
      total: 1,
    });
    const decide = vi
      .spyOn(jobsApi, 'decide')
      .mockResolvedValue({ ...offer, status: 'SHORTLISTED' });
    renderMission();

    expect(await screen.findByText('1 proposition reçue')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Se proposer' })).toBeNull();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Retenir la proposition (Moussa Traoré)' }),
    );
    await waitFor(() => expect(decide).toHaveBeenCalledWith(301, 'SHORTLISTED'));
    expect(await screen.findByText('Retenue')).toBeTruthy();
  });
});

describe('MissionForm (JOB-5)', () => {
  it('refuse un délai hors limites puis publie la mission', async () => {
    const create = vi.spyOn(missionsApi, 'create');
    const onCreated = vi.fn();
    wrap(<MissionForm onSaved={onCreated} />);

    fireEvent.click(screen.getByLabelText(/Revue de code/));
    type(/^Titre/, "Revue d'une API Laravel de paiement");
    type(
      /^Description/,
      'Une API Laravel qui encaisse via Orange Money. Je voudrais un avis sur la sécurité des webhooks.',
    );
    type(/^Technologies/, 'laravel, php');
    type(/^Délai souhaité/, '120');
    fireEvent.click(screen.getByRole('button', { name: 'Publier la mission' }));
    expect(await screen.findByText(/entre 1 et 90 jours/)).toBeTruthy();
    expect(create).not.toHaveBeenCalled();

    type(/^Délai souhaité/, '3');
    type(/^Budget indicatif/, '40000');
    fireEvent.click(screen.getByRole('button', { name: 'Publier la mission' }));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'CODE_REVIEW',
        budget: { amount: 40000, currency: 'XOF' },
        durationDays: 3,
        technologies: ['laravel', 'php'],
      }),
    );
  });
});

describe('modifier une mission (JOB-5)', () => {
  it('garde le budget, la monnaie et le pays de la mission modifiée', async () => {
    const mission = (await import('../../mocks/GET_missions_id.json')).default as MissionDetail;
    const update = vi.spyOn(missionsApi, 'update');
    const onSaved = vi.fn();
    wrap(<MissionForm initial={mission} onSaved={onSaved} />);

    expect((screen.getByLabelText(/^Budget indicatif/) as HTMLInputElement).value).toBe('75000');
    type(/^Délai souhaité/, '7');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(update).toHaveBeenCalledWith(
      14,
      expect.objectContaining({
        kind: mission.kind,
        budget: { amount: 75000, currency: 'XOF' },
        durationDays: 7,
        countryCode: mission.countryCode ?? null,
      }),
    );
  });
});

describe('MissionsPage (JOB-5)', () => {
  it("transmet le pays choisi dans l'adresse au serveur", async () => {
    const list = vi.spyOn(missionsApi, 'list');
    wrap(
      <Routes>
        <Route path="/missions" element={<MissionsPage />} />
      </Routes>,
      '/missions?country=CI',
    );
    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(expect.objectContaining({ country: 'CI', kind: 'all' })),
    );
    expect(await screen.findByRole('combobox', { name: /Pays/ })).toBeTruthy();
  });
});
