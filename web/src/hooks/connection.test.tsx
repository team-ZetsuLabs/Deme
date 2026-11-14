import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import i18n from '../i18n';
import { ApiError } from '../api/api';
import { LoadingRegion, SLOW_AFTER_MS } from '../components/skeleton/LoadingRegion';
import { useApiQuery } from './useApiQuery';

const setOnline = (online: boolean) => vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('écran de chargement lié à la connexion', () => {
  it('prévient quand on est hors ligne', () => {
    setOnline(false);
    render(<LoadingRegion>bloc</LoadingRegion>);
    expect(screen.getByRole('status').textContent).toContain('Vous êtes hors ligne');
  });

  it('prévient quand le chargement dure plus de 4 secondes', () => {
    vi.useFakeTimers();
    setOnline(true);
    render(<LoadingRegion>bloc</LoadingRegion>);
    expect(screen.queryByText(/Connexion lente/)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(SLOW_AFTER_MS);
    });
    expect(screen.getByText(/Connexion lente/)).toBeTruthy();
  });
});

function Probe({ fetcher }: { fetcher: () => Promise<string> }) {
  const query = useApiQuery(fetcher, []);
  if (query.loading) return <p>chargement</p>;
  if (query.error) return <p>erreur</p>;
  return <p>{query.data}</p>;
}

describe('useApiQuery et la connexion', () => {
  it("attend le retour du réseau au lieu d'afficher une erreur, puis recharge", async () => {
    const online = setOnline(false);
    const fetcher = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new ApiError(0, { code: 'NETWORK_ERROR', message: 'offline' }))
      .mockResolvedValueOnce('questions chargées');
    render(<Probe fetcher={fetcher} />);

    await act(async () => {});
    expect(screen.getByText('chargement')).toBeTruthy();
    expect(screen.queryByText('erreur')).toBeNull();

    online.mockReturnValue(true);
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });
    expect(await screen.findByText('questions chargées')).toBeTruthy();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('affiche une erreur réseau en ligne, puis la relance au retour du réseau', async () => {
    setOnline(true);
    const fetcher = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new ApiError(0, { code: 'NETWORK_ERROR', message: 'down' }))
      .mockResolvedValueOnce('de retour');
    render(<Probe fetcher={fetcher} />);
    expect(await screen.findByText('erreur')).toBeTruthy();

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });
    expect(await screen.findByText('de retour')).toBeTruthy();
  });
});
