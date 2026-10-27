import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../i18n';
import type { Me } from '../../api/types';
import { ToastProvider } from '../../components/ToastProvider';
import { authApi } from '../../features/auth/authApi';
import { SessionProvider } from '../../features/auth/SessionProvider';
import { ThemeProvider } from '../../theme/ThemeProvider';
import SettingsPage from './SettingsPage';
import { demoMe } from '../../test/fixtures';

const member: Me = demoMe({ skills: ['flutter'], providers: ['github'], hasPassword: false });

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
