import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../i18n';
import type { Me } from '../../api/provisional-types';
import { ToastProvider } from '../../components/ToastProvider';
import { authApi } from '../../features/auth/authApi';
import { SessionProvider } from '../../features/auth/SessionProvider';
import { photoError } from '../../features/settings/photo';
import { ThemeProvider } from '../../theme/ThemeProvider';
import SettingsPage from './SettingsPage';

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
  skills: ['flutter'],
  recruiterVisible: false,
  providers: ['github'],
  hasPassword: false,
  onboarded: true,
};

const renderSettings = () =>
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/settings']}>
        <SessionProvider>
          <ToastProvider>
            <Routes>
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/questions" element={<h1>Fil des questions</h1>} />
            </Routes>
          </ToastProvider>
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('photo de profil (SET-1)', () => {
  it('refuse un mauvais type ou une image trop lourde', () => {
    expect(photoError(new File(['x'], 'cv.pdf', { type: 'application/pdf' }))).toBe(
      'settings.photo.badType',
    );
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'photo.png', {
      type: 'image/png',
    });
    expect(photoError(big)).toBe('settings.photo.tooBig');
    expect(photoError(new File(['x'], 'photo.webp', { type: 'image/webp' }))).toBeNull();
  });
});

describe('SettingsPage', () => {
  it('enregistre le profil avec la visibilité recruteurs', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    const update = vi.spyOn(authApi, 'updateMe');
    renderSettings();

    const bio = await screen.findByLabelText(/^Présentation/);
    fireEvent.change(bio, { target: { value: 'Développeuse Flutter à Ouagadougou.' } });
    fireEvent.click(screen.getByLabelText(/Visible par les recruteurs/));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        name: 'Aminata Ouédraogo',
        city: 'Ouagadougou',
        bio: 'Développeuse Flutter à Ouagadougou.',
        skills: ['flutter'],
        recruiterVisible: true,
      }),
    );
  });

  it('empêche de délier le seul moyen de connexion', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    renderSettings();
    const unlink = await screen.findByRole('button', { name: 'Déconnecter GitHub' });
    expect((unlink as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/seul moyen de connexion/)).toBeTruthy();
  });

  it('supprime le compte seulement après avoir tapé le mot de confirmation', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    const remove = vi.spyOn(authApi, 'deleteAccount').mockResolvedValue(undefined);
    renderSettings();

    fireEvent.click(await screen.findByRole('button', { name: 'Supprimer mon compte' }));
    const input = screen.getByLabelText('Tapez SUPPRIMER pour confirmer');
    fireEvent.change(input, { target: { value: 'supprimer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement' }));
    expect(await screen.findByText(/en majuscules/)).toBeTruthy();
    expect(remove).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'SUPPRIMER' } });
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement' }));
    expect(await screen.findByRole('heading', { name: 'Fil des questions' })).toBeTruthy();
    expect(remove).toHaveBeenCalled();
  });
});
