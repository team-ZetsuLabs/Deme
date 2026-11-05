import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { createApi } from '../api/api';
import { resetMaintenance } from '../api/maintenance';
import { MaintenanceGate } from './MaintenanceGate';
import { RouteErrorFallback } from './RouteErrorFallback';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  act(() => resetMaintenance());
});

const renderGate = () =>
  render(
    <MemoryRouter>
      <MaintenanceGate>
        <p>Contenu de la page</p>
      </MaintenanceGate>
    </MemoryRouter>,
  );

describe('Maintenance', () => {
  it("remplace les écrans quand l'API répond 503 MAINTENANCE", async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(503, { code: 'MAINTENANCE', message: 'Maintenance en cours' }),
        ),
    );
    renderGate();
    expect(screen.getByText('Contenu de la page')).toBeTruthy();

    await act(async () => {
      await createApi('live')
        .get('/questions')
        .catch(() => undefined);
    });
    expect(screen.getByRole('heading', { name: 'Dɛmɛ est en maintenance' })).toBeTruthy();
    expect(screen.queryByText('Contenu de la page')).toBeNull();
  });

  it('ignore une autre erreur 503', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse(503, { code: 'AI_UNAVAILABLE', message: 'Indisponible' })),
    );
    renderGate();
    await act(async () => {
      await createApi('live')
        .post('/ai/question-assist', {})
        .catch(() => undefined);
    });
    expect(screen.getByText('Contenu de la page')).toBeTruthy();
  });
});

describe("Page d'erreur", () => {
  it('propose de réessayer ou de revenir aux questions', () => {
    render(<RouteErrorFallback />);
    expect(screen.getByRole('alert').textContent).toContain("Cette page n'a pas pu s'afficher");
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Retour aux questions' }).getAttribute('href')).toBe(
      '/questions',
    );
  });
});
