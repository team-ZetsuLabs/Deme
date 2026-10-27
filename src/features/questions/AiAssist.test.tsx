import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import { api, ApiError } from '../../api/api';
import { ToastProvider } from '../../components/ToastProvider';
import { SessionProvider } from '../auth/SessionProvider';
import { aiApi, AI_TIMEOUT_MS } from './aiApi';
import { AskForm } from './AskForm';
import { questionsApi } from './questionsApi';

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

const type = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const fillVagueQuestion = () => {
  type(/^Titre/, 'Wave ça marche pas en prod');
  type(/^Détails/, "Le callback de paiement n'arrive pas sur mon serveur Spring Boot.");
};

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Assistant de rédaction (IA-1)', () => {
  it('reste désactivé tant que la question est presque vide', () => {
    renderForm();
    expect(
      (screen.getByRole('button', { name: "Améliorer avec l'IA" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("propose des suggestions étiquetées, appliquées seulement d'un clic", async () => {
    renderForm();
    fillVagueQuestion();
    fireEvent.click(screen.getByRole('button', { name: "Améliorer avec l'IA" }));

    expect(await screen.findByText("Suggestions générées par l'IA, à vérifier")).toBeTruthy();
    // Au moins 2 informations manquantes pour une question vague (critère 6.4).
    expect(screen.getByText("Le message d'erreur exact, copié tel quel.")).toBeTruthy();
    expect(screen.getByText('Ce que vous avez déjà essayé.')).toBeTruthy();
    // Un tag qui n'existe pas encore est signalé comme nouveau.
    expect(screen.getByText('nouveau').parentElement?.textContent).toContain('wave-checkout');

    // Rien n'a changé sans accord.
    const title = screen.getByLabelText(/^Titre/) as HTMLInputElement;
    expect(title.value).toBe('Wave ça marche pas en prod');

    const [applyTitle, applyTags, applyContext] = screen.getAllByRole('button', {
      name: 'Appliquer',
    });
    fireEvent.click(applyTitle);
    expect(title.value).toContain("Le callback Wave n'arrive jamais en production");
    fireEvent.click(applyTags);
    expect((screen.getByLabelText(/^Tags/) as HTMLInputElement).value).toBe(
      'wave, spring-boot, mobile-money, wave-checkout',
    );
    fireEvent.click(applyContext);
    expect((screen.getByLabelText(/^Opérateur mobile money/) as HTMLSelectElement).value).toBe(
      'WAVE',
    );
    expect(screen.getByRole('combobox', { name: /^Pays/ }).textContent).toBe('Sénégal');
  });

  it('affiche les suggestions comme du texte, sans jamais exécuter de HTML', async () => {
    vi.spyOn(aiApi, 'assistQuestion').mockResolvedValue({
      title: '<img src=x onerror=alert(1)> Titre piégé',
      tags: [],
      context: {
        countryCode: null,
        mobileMoneyOperator: null,
        networkQuality: null,
        techVersion: null,
      },
      missing: [],
    });
    renderForm();
    fillVagueQuestion();
    fireEvent.click(screen.getByRole('button', { name: "Améliorer avec l'IA" }));
    expect(await screen.findByText('<img src=x onerror=alert(1)> Titre piégé')).toBeTruthy();
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });

  it("s'efface si l'API est coupée, et la question se publie quand même", async () => {
    vi.spyOn(aiApi, 'assistQuestion').mockRejectedValue(
      new ApiError(503, { code: 'AI_UNAVAILABLE', message: 'Indisponible' }),
    );
    const create = vi.spyOn(questionsApi, 'create');
    renderForm();
    type(/^Titre/, 'Le callback Wave ne revient jamais en production');
    type(/^Détails/, "Le callback de paiement n'arrive pas sur mon serveur Spring Boot.");
    type(/^Tags/, 'wave');
    fireEvent.click(screen.getByRole('button', { name: "Améliorer avec l'IA" }));

    expect(await screen.findByText(/L'assistant ne répond pas pour le moment/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: "Améliorer avec l'IA" })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Publier la question' }));
    await waitFor(() => expect(create).toHaveBeenCalled());
  });

  it('abandonne au bout de 8 secondes avec le code AI_TIMEOUT', async () => {
    vi.useFakeTimers();
    vi.spyOn(api, 'post').mockImplementation(
      (_path, _body, opts) =>
        new Promise((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    const pending = aiApi.assistQuestion({ title: 'Titre', body: 'Détails', code: null });
    const check = expect(pending).rejects.toMatchObject({ code: 'AI_TIMEOUT' });
    await vi.advanceTimersByTimeAsync(AI_TIMEOUT_MS);
    await check;
  });
});
