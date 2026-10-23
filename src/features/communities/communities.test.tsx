import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../i18n';
import { mockKey } from '../../api/api';
import { ToastProvider } from '../../components/ToastProvider';
import CommunitiesPage from '../../pages/communities/CommunitiesPage';
import CommunityPage from '../../pages/community/CommunityPage';
import { demoMe } from '../../test/fixtures';
import { authApi } from '../auth/authApi';
import { SessionProvider } from '../auth/SessionProvider';
import { communitiesApi } from './communitiesApi';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <ToastProvider>
          <Routes>
            <Route path="/communities" element={<CommunitiesPage />} />
            <Route path="/communities/:slug" element={<CommunityPage />} />
            <Route path="/login" element={<p>Page de connexion</p>} />
          </Routes>
        </ToastProvider>
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

describe('Communautés (COM-1)', () => {
  it('cherche les exemples par le slug de la communauté', () => {
    expect(mockKey('GET', '/communities/senegal')).toBe('GET_communities_slug');
    expect(mockKey('POST', '/communities/flutter/members')).toBe('POST_communities_slug_members');
    expect(mockKey('GET', '/users/me/communities')).toBe('GET_users_me_communities');
  });

  it('liste les communautés et filtre par type', async () => {
    const list = vi.spyOn(communitiesApi, 'list');
    renderAt('/communities');
    expect(await screen.findByRole('link', { name: 'Flutter' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Kenya' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Pays' }));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith({ kind: 'COUNTRY', q: null, page: 0 }),
    );
  });

  it('envoie vers la connexion quand on rejoint sans compte', async () => {
    renderAt('/communities');
    fireEvent.click(await screen.findByRole('button', { name: 'Rejoindre la communauté Kenya' }));
    expect(await screen.findByText('Page de connexion')).toBeTruthy();
  });

  it('rejoint une communauté et la montre dans « Mes communautés »', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(demoMe());
    const join = vi
      .spyOn(communitiesApi, 'join')
      .mockResolvedValue({ joined: true, memberCount: 977 });
    const mine = vi.spyOn(communitiesApi, 'mine');
    renderAt('/communities');

    expect(await screen.findByRole('heading', { name: 'Mes communautés' })).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: 'Rejoindre la communauté Kenya' }));

    await waitFor(() => expect(join).toHaveBeenCalledWith('kenya'));
    const button = await screen.findByRole('button', { name: 'Quitter la communauté Kenya' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/977 membres/)).toBeTruthy();
    // La liste « Mes communautés » est rechargée.
    await waitFor(() => expect(mine.mock.calls.length).toBeGreaterThan(1));
  });

  it('affiche une communauté : questions, Référents, règles et question préremplie', async () => {
    const get = vi.spyOn(communitiesApi, 'get');
    renderAt('/communities/senegal');
    expect(await screen.findByRole('heading', { level: 1, name: 'Sénégal' })).toBeTruthy();
    expect(get).toHaveBeenCalledWith('senegal');
    expect(screen.getByRole('link', { name: 'Poser une question ici' }).getAttribute('href')).toBe(
      '/questions/ask?country=SN',
    );

    // Onglet Questions par défaut.
    expect(
      await screen.findByRole('link', { name: /notification de paiement Orange Money/ }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Membres' }));
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByRole('heading', { name: 'Référents' })).toBeTruthy();
    expect(within(panel).getByRole('link', { name: 'Moussa Sow' })).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Règles' }));
    expect(screen.getByText(/Pas d'offre d'emploi ici/)).toBeTruthy();
  });
});

describe('Communautés, visiteur sans compte', () => {
  it("n'affiche jamais « Membre » sans session", async () => {
    renderAt('/communities');
    await screen.findByRole('link', { name: 'Sénégal' });
    expect(screen.queryByRole('button', { name: /^Quitter la communauté/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Rejoindre la communauté Sénégal' })).toBeTruthy();
  });
});
