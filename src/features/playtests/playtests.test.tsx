import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '../../i18n';
import type { PlaytestDetail } from '../../api/types';
import { ToastProvider } from '../../components/ToastProvider';
import { SessionProvider } from '../auth/SessionProvider';
import { authApi } from '../auth/authApi';
import { demoMe } from '../../test/fixtures';
import PlaytestsPage from '../../pages/playtests/PlaytestsPage';
import PlaytestPage from '../../pages/playtest/PlaytestPage';
import NewPlaytestPage from '../../pages/playtest-new/NewPlaytestPage';
import { ParticipationPanel } from './ParticipationPanel';
import { playtestsApi } from './playtestsApi';

const wrap = (ui: ReactNode, path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <ToastProvider>{ui}</ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );

const set = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('liste des campagnes (TST-1)', () => {
  it('affiche les campagnes, toutes plateformes', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(demoMe());
    wrap(<PlaytestsPage />, '/playtests');
    expect(await screen.findByText('Tontine Cash')).toBeTruthy();
    expect(screen.getByText('ChampReçu')).toBeTruthy();
    // La campagne web (sans package) affiche sa plateforme à la place.
    expect(await screen.findByText('SamaDaara')).toBeTruthy();
    expect(screen.getByText('Complète')).toBeTruthy();
  });
});

describe('participation (TST-2)', () => {
  const renderDetail = () =>
    wrap(
      <Routes>
        <Route path="/playtests/:id" element={<PlaytestPage />} />
      </Routes>,
      '/playtests/7',
    );

  it('un membre rejoint une campagne, puis voit le lien et la confirmation', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(demoMe({ username: 'koffi_m' }));
    const join = vi.spyOn(playtestsApi, 'join');
    renderDetail();

    fireEvent.click(await screen.findByRole('button', { name: 'Rejoindre le test' }));
    await waitFor(() => expect(join).toHaveBeenCalledWith(7));
    expect(await screen.findByText('Ouvrir le test Google Play')).toBeTruthy();
    expect(screen.getByRole('button', { name: "J'ai installé l'application" })).toBeTruthy();
  });

  it('propose au porteur de piloter sa campagne, pas de la rejoindre', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(demoMe({ username: 'aminata_dev' }));
    renderDetail();
    expect(await screen.findByText('Votre campagne.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Rejoindre le test' })).toBeNull();
  });

  it('une campagne web (sans décompte) ne montre pas « toujours inscrit »', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(demoMe({ username: 'koffi_m' }));
    const web = {
      id: 9,
      platform: 'WEB',
      tracking: 'NONE',
      requiredDays: 0,
      canJoin: false,
      optInUrl: 'https://samadaara.sn',
      myParticipation: {
        id: 5,
        status: 'CONFIRMED',
        proofLevel: 'DECLARED',
        daysDone: 2,
        requiredDays: 0,
        joinedAt: '2026-11-08T10:00:00Z',
        checkedInToday: false,
        needsAttention: false,
      },
    } as unknown as PlaytestDetail;
    wrap(<ParticipationPanel playtest={web} onChange={() => undefined} />);
    expect(await screen.findByText(/jours depuis l.installation/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Je suis toujours inscrit' })).toBeNull();
  });
});

describe('créer une campagne (TST-1, TST-7)', () => {
  const renderNew = () =>
    wrap(
      <Routes>
        <Route path="/playtests/new" element={<NewPlaytestPage />} />
        <Route path="/playtests/:id" element={<h1>Campagne</h1>} />
      </Routes>,
      '/playtests/new',
    );

  it('refuse un identifiant invalide, puis publie (crée + envoie) la campagne', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(demoMe());
    const create = vi.spyOn(playtestsApi, 'create');
    const submit = vi.spyOn(playtestsApi, 'submit');
    renderNew();

    set(/^Nom de l'application/, 'Tontine Cash');
    set(/^Identifiant de l'application/, 'pas valide');
    set(/^Description/, 'Application de tontine avec Orange Money et Wave.');
    set(/^Lien d'inscription/, 'https://play.google.com/apps/testing/sn.tontinecash.app');
    fireEvent.click(screen.getByRole('button', { name: 'Publier la campagne' }));
    expect(await screen.findByText(/identifiant Android valide/)).toBeTruthy();
    expect(create).not.toHaveBeenCalled();

    set(/^Identifiant de l'application/, 'sn.tontinecash.app');
    fireEvent.click(screen.getByRole('button', { name: 'Publier la campagne' }));
    await waitFor(() => expect(create).toHaveBeenCalled());
    const body = create.mock.calls[0][0];
    expect(body.platform).toBe('GOOGLE_PLAY');
    expect(body.requiredDays).toBe(14);
    // Publier = créer puis soumettre, sans repasser par le brouillon.
    await waitFor(() => expect(submit).toHaveBeenCalled());
    expect(await screen.findByRole('heading', { name: 'Campagne' })).toBeTruthy();
  });

  it('peut aussi enregistrer comme brouillon, sans publier', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(demoMe());
    const create = vi.spyOn(playtestsApi, 'create');
    const submit = vi.spyOn(playtestsApi, 'submit');
    renderNew();

    set(/^Nom de l'application/, 'Tontine Cash');
    set(/^Identifiant de l'application/, 'sn.tontinecash.app');
    set(/^Description/, 'Application de tontine avec Orange Money et Wave.');
    set(/^Lien d'inscription/, 'https://play.google.com/apps/testing/sn.tontinecash.app');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer comme brouillon' }));
    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(submit).not.toHaveBeenCalled();
  });

  it('en plateforme web, masque l’identifiant et crée sans package', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(demoMe());
    const create = vi.spyOn(playtestsApi, 'create');
    renderNew();

    fireEvent.click(screen.getByRole('radio', { name: /Application web/ }));
    expect(screen.queryByLabelText(/^Identifiant de l'application/)).toBeNull();

    set(/^Nom de l'application/, 'SamaDaara');
    set(/^Description/, 'Plateforme web de suivi scolaire pour les parents.');
    set(/^Lien d'inscription/, 'https://samadaara.sn');
    fireEvent.click(screen.getByRole('button', { name: 'Publier la campagne' }));
    await waitFor(() => expect(create).toHaveBeenCalled());
    const body = create.mock.calls[0][0];
    expect(body.platform).toBe('WEB');
    expect(body.packageName).toBeUndefined();
  });
});
