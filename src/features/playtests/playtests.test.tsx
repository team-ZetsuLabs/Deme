import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '../../i18n';
import { ToastProvider } from '../../components/ToastProvider';
import { SessionProvider } from '../auth/SessionProvider';
import { authApi } from '../auth/authApi';
import { demoMe } from '../../test/fixtures';
import PlaytestsPage from '../../pages/playtests/PlaytestsPage';
import PlaytestPage from '../../pages/playtest/PlaytestPage';
import NewPlaytestPage from '../../pages/playtest-new/NewPlaytestPage';
import { playtestsApi } from './playtestsApi';

const wrap = (ui: ReactNode, path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <ToastProvider>{ui}</ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('liste des campagnes (TST-1)', () => {
  it('affiche les campagnes de test fermé', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(demoMe());
    wrap(<PlaytestsPage />, '/playtests');
    expect(await screen.findByText('Tontine Cash')).toBeTruthy();
    expect(screen.getByText('ChampReçu')).toBeTruthy();
    // La campagne complète est signalée.
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
    // L'exemple appartient à aminata_dev : on se connecte avec un autre membre.
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
});

describe('créer une campagne (TST-1)', () => {
  it('refuse un nom de paquet invalide puis crée le brouillon', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(demoMe());
    const create = vi.spyOn(playtestsApi, 'create');
    wrap(
      <Routes>
        <Route path="/playtests/new" element={<NewPlaytestPage />} />
        <Route path="/playtests/:id" element={<h1>Campagne</h1>} />
      </Routes>,
      '/playtests/new',
    );

    const set = (label: RegExp, value: string) =>
      fireEvent.change(screen.getByLabelText(label), { target: { value } });

    set(/^Nom de l'application/, 'Tontine Cash');
    set(/^Nom du paquet/, 'pas valide');
    set(/^Description/, 'Application de tontine avec Orange Money et Wave.');
    set(/^Lien d'inscription/, 'https://play.google.com/apps/testing/sn.tontinecash.app');
    fireEvent.click(screen.getByRole('button', { name: 'Créer le brouillon' }));
    expect(await screen.findByText(/nom de paquet valide/)).toBeTruthy();
    expect(create).not.toHaveBeenCalled();

    set(/^Nom du paquet/, 'sn.tontinecash.app');
    fireEvent.click(screen.getByRole('button', { name: 'Créer le brouillon' }));
    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(await screen.findByRole('heading', { name: 'Campagne' })).toBeTruthy();
  });
});
