import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '../../i18n';
import { ToastProvider } from '../../components/ToastProvider';
import { SessionProvider } from '../auth/SessionProvider';
import QuestionPage from '../../pages/question/QuestionPage';
import { AskForm } from './AskForm';
import { questionsApi } from './questionsApi';
import { parseTags, validateTags, validateTitle } from './validation';

const wrap = (ui: ReactNode, path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <ToastProvider>{ui}</ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );

const type = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('règles de QA-1', () => {
  it('normalise les tags et refuse les doublons', () => {
    expect(parseTags(' Spring Boot, mobile-money, spring boot ,')).toEqual([
      'spring-boot',
      'mobile-money',
    ]);
  });

  it('exige de 1 à 4 tags au bon format', () => {
    expect(validateTags('')).toBe('ask.errors.tagsCount');
    expect(validateTags('a, b, c, d, e')).toBe('ask.errors.tagsCount');
    expect(validateTags('<script>')).toBe('ask.errors.tagFormat');
    expect(validateTags('flutter, node.js')).toBeNull();
  });

  it('exige un titre de 15 à 150 caractères', () => {
    expect(validateTitle('Bug paiement')).toBe('ask.errors.titleLength');
    expect(validateTitle('Wave renvoie une erreur 500 au callback')).toBeNull();
  });
});

describe('AskForm', () => {
  it('envoie la question avec son contexte africain', async () => {
    const create = vi.spyOn(questionsApi, 'create');
    const onPosted = vi.fn();
    wrap(<AskForm initialTitle="" defaultCountry="BF" onPosted={onPosted} />);

    type(/^Titre/, 'Orange Money renvoie 401 malgré un token valide');
    type(/^Détails/, "Le token est récupéré mais l'appel de paiement échoue toujours.");
    type(/^Tags/, 'mobile-money, node.js');
    type(/^Opérateur mobile money/, 'ORANGE_MONEY');
    fireEvent.click(screen.getByLabelText('Réseau instable'));
    fireEvent.click(screen.getByRole('button', { name: 'Publier la question' }));

    await waitFor(() => expect(onPosted).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith({
      title: 'Orange Money renvoie 401 malgré un token valide',
      body: "Le token est récupéré mais l'appel de paiement échoue toujours.",
      code: null,
      tags: ['mobile-money', 'node.js'],
      context: { country: 'BF', operator: 'ORANGE_MONEY', network: 'UNSTABLE', techVersion: null },
    });
  });

  it("n'envoie rien tant que le formulaire est invalide", async () => {
    const create = vi.spyOn(questionsApi, 'create');
    wrap(<AskForm initialTitle="" defaultCountry={null} onPosted={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Publier la question' }));
    expect(await screen.findByText(/entre 15 et 150 caractères/)).toBeTruthy();
    expect(create).not.toHaveBeenCalled();
  });
});

describe('QuestionPage', () => {
  it('affiche la question, la réponse acceptée en tête et le même pays', async () => {
    wrap(
      <Routes>
        <Route path="/questions/:id" element={<QuestionPage />} />
      </Routes>,
      '/questions/1',
    );
    expect(await screen.findByRole('heading', { level: 1 })).toBeTruthy();
    const answers = document.querySelectorAll('article[id^="answer-"]');
    expect(answers[0].id).toBe('answer-11');
    expect(answers[0].textContent).toContain('Réponse acceptée');
    // Mamadou Ndiaye vient du Sénégal, comme la question (QA-10).
    expect(document.getElementById('answer-12')?.textContent).toContain(
      'Même pays que la question',
    );
  });
});
