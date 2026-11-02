import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '../../i18n';
import type { Me } from '../../api/types';
import { ToastProvider } from '../../components/ToastProvider';
import FeedPage from '../../pages/feed/FeedPage';
import { authApi } from '../auth/authApi';
import { SessionProvider } from '../auth/SessionProvider';
import { demoMe } from '../../test/fixtures';

const member: Me = demoMe();

const wrap = (ui: ReactNode) =>
  render(
    <MemoryRouter initialEntries={['/feed']}>
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

describe('FeedPage (accueil portail)', () => {
  it('accueille le membre et rassemble un aperçu de chaque espace', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    wrap(<FeedPage />);

    expect(await screen.findByRole('heading', { name: /Bonjour Aminata Diallo/ })).toBeTruthy();
    // Les sections du portail sont présentes.
    expect(await screen.findByRole('heading', { name: 'Questions récentes' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Offres récentes' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Missions ouvertes' })).toBeTruthy();
    // Un contenu réel apparaît dans une section (question du mock).
    expect((await screen.findAllByText(/Orange Money/)).length).toBeGreaterThan(0);
  });
});
