import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../i18n';
import type { Connections, Me } from '../../api/types';
import { ToastProvider } from '../../components/ToastProvider';
import { authApi } from '../../features/auth/authApi';
import { SessionProvider } from '../../features/auth/SessionProvider';
import { ThemeProvider } from '../../theme/ThemeProvider';
import SettingsPage from './SettingsPage';
import { demoMe } from '../../test/fixtures';

const member: Me = demoMe({ technologies: ['flutter'] });

// Compte créé avec GitHub, sans mot de passe : GitHub est le seul moyen de connexion.
const githubOnly: Connections = {
  accounts: [
    { provider: 'github', linked: true, linkedAt: '2026-10-20T09:14:00Z', canUnlink: false },
    { provider: 'google', linked: false, linkedAt: null, canUnlink: false },
  ],
  hasPassword: false,
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

describe('SettingsPage', () => {
  it("envoie le lien pour créer un mot de passe à l'adresse du compte", async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    vi.spyOn(authApi, 'connections').mockResolvedValue(githubOnly);
    const reset = vi.spyOn(authApi, 'requestPasswordReset').mockResolvedValue(undefined);
    renderSettings();
    fireEvent.click(await screen.findByRole('button', { name: 'Créer un mot de passe' }));
    expect(await screen.findByRole('button', { name: 'Lien envoyé' })).toBeTruthy();
    expect(reset).toHaveBeenCalledWith(member.email);
  });

  it('empêche de délier le seul moyen de connexion', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    vi.spyOn(authApi, 'connections').mockResolvedValue(githubOnly);
    renderSettings();
    const unlink = await screen.findByRole('button', { name: 'Déconnecter GitHub' });
    expect((unlink as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/seul moyen de connexion/)).toBeTruthy();
  });

  it('supprime le compte seulement après avoir recopié son pseudo', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    const remove = vi.spyOn(authApi, 'deleteAccount').mockResolvedValue(undefined);
    renderSettings();

    fireEvent.click(await screen.findByRole('button', { name: 'Supprimer mon compte' }));
    const input = screen.getByLabelText('Recopiez votre pseudo aminata_dev pour confirmer');
    fireEvent.change(input, { target: { value: 'aminata' } });
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement' }));
    expect(await screen.findByText(/Recopiez exactement/)).toBeTruthy();
    expect(remove).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'aminata_dev' } });
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement' }));
    expect(await screen.findByRole('heading', { name: 'Fil des questions' })).toBeTruthy();
    expect(remove).toHaveBeenCalledWith('aminata_dev');
  });
});
