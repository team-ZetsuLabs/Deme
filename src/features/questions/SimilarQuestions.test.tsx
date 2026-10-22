import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import { ApiError } from '../../api/api';
import { ToastProvider } from '../../components/ToastProvider';
import { SessionProvider } from '../auth/SessionProvider';
import { AskForm } from './AskForm';
import { questionsApi } from './questionsApi';
import { SIMILAR_MAX } from './useSimilarQuestions';

const renderForm = () =>
  render(
    <MemoryRouter>
      <SessionProvider>
        <ToastProvider>
          <AskForm initialTitle="" defaultCountry={null} onPosted={vi.fn()} />
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );

const typeTitle = (value: string) =>
  fireEvent.change(screen.getByLabelText(/^Titre/), { target: { value } });

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Questions similaires (QA-8)', () => {
  it('ne cherche rien sous 15 caractères', async () => {
    const search = vi.spyOn(questionsApi, 'search');
    renderForm();
    typeTitle('Orange Money');
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(search).not.toHaveBeenCalled();
    expect(screen.queryByText('Questions similaires')).toBeNull();
  });

  it('cherche une seule fois après une pause, et ouvre les liens dans un nouvel onglet', async () => {
    const search = vi.spyOn(questionsApi, 'search');
    renderForm();
    typeTitle('Orange Money renvoie');
    typeTitle('Orange Money renvoie 401');
    typeTitle('Orange Money renvoie 401 en production');

    const link = await screen.findByRole('link', { name: /L'API Orange Money renvoie 401/ });
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith(
      'Orange Money renvoie 401 en production',
      SIMILAR_MAX,
      expect.any(AbortSignal),
    );
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(screen.getAllByRole('listitem').length).toBeLessThanOrEqual(SIMILAR_MAX);
  });

  it("dit quand rien ne ressemble, et reste discret en cas d'erreur", async () => {
    const search = vi
      .spyOn(questionsApi, 'search')
      .mockResolvedValueOnce({ items: [], page: 0, size: SIMILAR_MAX, total: 0 })
      .mockRejectedValueOnce(new ApiError(0, { code: 'NETWORK_ERROR', message: 'Hors ligne' }));
    renderForm();

    typeTitle('Erreur de compilation Flutter sur Android 14');
    expect(await screen.findByText(/Aucune question similaire/)).toBeTruthy();

    typeTitle('Erreur de compilation Flutter sur Android 15');
    await waitFor(() => expect(search).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/ne sont pas disponibles pour le moment/)).toBeTruthy();
  });
});
