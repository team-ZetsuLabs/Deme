import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../i18n';
import type { PublicProfile } from '../../api/types';
import { ToastProvider } from '../../components/ToastProvider';
import { SessionProvider } from '../../features/auth/SessionProvider';
import { usersApi } from '../../features/profile/usersApi';
import profileMock from '../../mocks/GET_users_username.json';
import ProfilePage from './ProfilePage';

const renderProfile = (username = 'kwame_codes') =>
  render(
    <MemoryRouter initialEntries={[`/users/${username}`]}>
      <SessionProvider>
        <ToastProvider>
          <Routes>
            <Route path="/users/:username" element={<ProfilePage />} />
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

describe('ProfilePage (REP-5)', () => {
  it('affiche le profil public et son historique de réputation', async () => {
    const get = vi.spyOn(usersApi, 'get');
    renderProfile();
    expect(await screen.findByRole('heading', { name: 'Kwame Asante' })).toBeTruthy();
    expect(get).toHaveBeenCalledWith('kwame_codes');
    expect(screen.getByText('@kwame_codes')).toBeTruthy();
    expect(screen.getByText('Référent')).toBeTruthy();
    // Historique (REP-1) : chaque action avec ses points.
    expect(await screen.findByText('Réponse acceptée')).toBeTruthy();
    expect(screen.getByText('+15')).toBeTruthy();
  });

  it('montre la progression vers le niveau suivant', async () => {
    vi.spyOn(usersApi, 'get').mockResolvedValue({
      ...(profileMock as PublicProfile),
      username: 'aminata_dev',
      displayName: 'Aminata Diallo',
      reputation: 342,
      level: 'MEMBER',
      visibleToRecruiters: true,
    });
    renderProfile('aminata_dev');
    expect(await screen.findByRole('heading', { name: 'Aminata Diallo' })).toBeTruthy();
    expect(screen.getByText('Encore 158 points avant le niveau Contributeur')).toBeTruthy();
    expect(screen.getByText('Visible par les recruteurs')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('342');
  });

  it('change d’onglet au clavier', async () => {
    renderProfile();
    const activity = await screen.findByRole('tab', { name: 'Activité' });
    activity.focus();
    fireEvent.keyDown(activity, { key: 'ArrowRight' });
    const skills = screen.getByRole('tab', { name: 'Compétences' });
    expect(skills.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(skills);
  });

  it('affiche la page introuvable pour un pseudo inconnu', async () => {
    const { ApiError } = await import('../../api/api');
    vi.spyOn(usersApi, 'get').mockRejectedValue(
      new ApiError(404, { code: 'USER_NOT_FOUND', message: 'Membre introuvable' }),
    );
    renderProfile('inconnu');
    expect(await screen.findByRole('heading', { name: "Cette page n'existe pas" })).toBeTruthy();
  });
});
