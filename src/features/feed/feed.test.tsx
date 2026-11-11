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
import { mergeFeed } from './feedEntries';

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

describe('mergeFeed', () => {
  it('mélange les espaces et trie du plus récent au plus ancien', () => {
    const entries = mergeFeed({
      questions: [{ id: 1, createdAt: '2026-11-01T00:00:00Z' } as never],
      jobs: [{ id: 2, createdAt: '2026-11-03T00:00:00Z' } as never],
      playtests: [{ id: 3, createdAt: '2026-11-02T00:00:00Z' } as never],
    });
    expect(entries.map((e) => e.kind)).toEqual(['job', 'playtest', 'question']);
  });
});

describe('FeedPage (fil unifié)', () => {
  it('accueille le membre et mélange tous les espaces dans un seul fil', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    wrap(<FeedPage />);

    expect(await screen.findByRole('heading', { name: /Bonjour Aminata Diallo/ })).toBeTruthy();
    // Des éléments de plusieurs espaces apparaissent, chacun avec son type.
    expect((await screen.findAllByText('Question')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Offre d.emploi/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Test fermé').length).toBeGreaterThan(0);
    // Un contenu réel d'un espace (question du mock).
    expect((await screen.findAllByText(/Orange Money/)).length).toBeGreaterThan(0);
    // Le rail de profil est présent.
    expect(screen.getByRole('link', { name: 'Voir mon profil' })).toBeTruthy();
  });
});
