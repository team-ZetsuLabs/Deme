import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../i18n';
import type { Me } from '../../api/types';
import { ApiError } from '../../api/api';
import { ToastProvider } from '../../components/ToastProvider';
import { authApi } from '../../features/auth/authApi';
import { SessionProvider } from '../../features/auth/SessionProvider';
import { statsApi } from '../../features/home/statsApi';
import { ThemeProvider } from '../../theme/ThemeProvider';
import HomePage from './HomePage';

const renderHome = () =>
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/']}>
        <SessionProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
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

describe('HomePage', () => {
  it('présente la plateforme avec des chiffres et des questions venus de l’API', async () => {
    renderHome();
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: "L'entraide entre développeurs africains",
      }),
    ).toBeTruthy();
    // Chiffres de /stats, pas écrits en dur.
    expect(await screen.findByText('questions posées')).toBeTruthy();
    expect(screen.getByText('68 %')).toBeTruthy();
    // Trois questions résolues au plus, avec leur contexte africain.
    const solved = await screen.findAllByRole('heading', { level: 3, name: /./ });
    expect(solved.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Orange Money').length).toBeGreaterThan(0);
  });

  it('reste complète si les chiffres ne sont pas disponibles', async () => {
    vi.spyOn(statsApi, 'get').mockRejectedValue(
      new ApiError(0, { code: 'NETWORK_ERROR', message: 'down' }),
    );
    renderHome();
    expect(await screen.findByText('Modéré par la communauté')).toBeTruthy();
    expect(screen.queryByText('questions posées')).toBeNull();
    // Seuils par défaut du cahier.
    expect(screen.getByText('dès 1 500 points')).toBeTruthy();
  });

  it('envoie un membre connecté vers les questions', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue({ id: 9, onboarded: true } as Me);
    renderHome();
    expect(await screen.findByRole('heading', { name: 'Fil des questions' })).toBeTruthy();
  });
});
