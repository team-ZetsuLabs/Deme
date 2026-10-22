import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '../../i18n';
import type { Me, MissionDetail } from '../../api/provisional-types';
import { ToastProvider } from '../../components/ToastProvider';
import MissionPage from '../../pages/mission/MissionPage';
import { authApi } from '../auth/authApi';
import { SessionProvider } from '../auth/SessionProvider';
import { MissionForm } from './MissionForm';
import { missionsApi } from './missionsApi';
import { formatMoney } from './money';

const member: Me = {
  id: 9,
  name: 'Aminata Ouédraogo',
  email: 'aminata.ouedraogo@example.com',
  country: 'BF',
  city: 'Ouagadougou',
  photoUrl: null,
  bio: null,
  reputation: 120,
  level: 'MEMBER',
  language: 'fr',
  skills: ['php', 'mobile-money'],
  recruiterVisible: false,
  providers: [],
  hasPassword: true,
  onboarded: true,
};

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
    type(/^Votre délai/, '4');
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer ma proposition' }));

    await waitFor(() =>
      expect(offer).toHaveBeenCalledWith(1, {
        message: "J'ai intégré Wave sur deux boutiques WooCommerce à Dakar l'an dernier.",
        price: { amount: 70000, currency: 'XOF' },
        delayDays: 4,
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
      excerpt: '',
      budget: { amount: 75000, currency: 'XOF' },
      delayDays: 5,
      technologies: ['php'],
      author: {
        id: 9,
        name: 'Aminata Ouédraogo',
        photoUrl: null,
        country: 'BF',
        city: null,
        reputation: 120,
      },
      createdAt: '2026-10-21T10:30:00Z',
      status: 'OPEN',
      offerCount: 1,
      myOffer: null,
      descriptionHtml: '<p>Description</p>',
      offers: [
        {
          id: 301,
          member: {
            id: 6,
            name: 'Moussa Traoré',
            photoUrl: null,
            country: 'ML',
            city: 'Bamako',
            reputation: 310,
          },
          message: 'Je peux commencer demain.',
          price: { amount: 70000, currency: 'XOF' },
          delayDays: 4,
          status: 'SENT',
          createdAt: '2026-10-21T11:00:00Z',
        },
      ],
    };
    vi.spyOn(missionsApi, 'get').mockResolvedValue(detail);
    const decide = vi.spyOn(missionsApi, 'decide');
    renderMission();

    expect(await screen.findByText('1 proposition reçue')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Se proposer' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retenir' }));
    await waitFor(() => expect(decide).toHaveBeenCalledWith(1, 301, { status: 'SHORTLISTED' }));
    expect(await screen.findByText('Retenue')).toBeTruthy();
  });
});

describe('MissionForm (JOB-5)', () => {
  it('refuse un délai hors limites puis publie la mission', async () => {
    const create = vi.spyOn(missionsApi, 'create');
    const onCreated = vi.fn();
    wrap(<MissionForm onCreated={onCreated} />);

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
        delayDays: 3,
        technologies: ['laravel', 'php'],
      }),
    );
  });
});
