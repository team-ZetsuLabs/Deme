import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '../../i18n';
import { ToastProvider } from '../../components/ToastProvider';
import { authApi } from '../auth/authApi';
import { appealsApi } from '../moderation/appealsApi';
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

describe('QuestionPage, modification (QA-3)', () => {
  it("permet à l'auteur, et à lui seul, de modifier sa réponse", async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue({
      id: 10,
      name: 'Mamadou Ndiaye',
      email: 'mamadou.ndiaye@example.com',
      country: 'SN',
      city: 'Thiès',
      photoUrl: null,
      reputation: 365,
      level: 'MEMBER',
      language: 'fr',
      skills: [],
      bio: null,
      recruiterVisible: false,
      providers: [],
      hasPassword: true,
      onboarded: true,
    });
    const update = vi.spyOn(questionsApi, 'updateAnswer').mockResolvedValue({
      id: 12,
      body: 'Utilisez bien l’URL de production, les tokens du bac à sable ne marchent pas.',
      bodyHtml:
        '<p>Utilisez bien l’URL de production, les tokens du bac à sable ne marchent pas.</p>',
      code: null,
      author: {
        id: 10,
        name: 'Mamadou Ndiaye',
        photoUrl: null,
        country: 'SN',
        city: 'Thiès',
        reputation: 365,
      },
      createdAt: '2026-10-21T09:25:00Z',
      votes: 3,
      voted: false,
      accepted: false,
    });
    wrap(
      <Routes>
        <Route path="/questions/:id" element={<QuestionPage />} />
      </Routes>,
      '/questions/1',
    );

    // Un seul bouton Modifier : celui de la réponse de Mamadou.
    const edit = await screen.findByRole('button', { name: 'Modifier' });
    expect(screen.getAllByRole('button', { name: 'Modifier' })).toHaveLength(1);
    fireEvent.click(edit);

    const textarea = screen.getByLabelText(/^Votre réponse/, { selector: '#edit-12-body' });
    expect((textarea as HTMLTextAreaElement).value).toContain('URL de production');
    fireEvent.change(textarea, {
      target: {
        value: 'Utilisez bien l’URL de production, les tokens du bac à sable ne marchent pas.',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la modification' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith(12, expect.any(Object)));
    expect(await screen.findByText(/les tokens du bac à sable ne marchent pas/)).toBeTruthy();
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

describe('QuestionPage, contenu masqué (MOD-2, MOD-3)', () => {
  const page = () =>
    wrap(
      <Routes>
        <Route path="/questions/:id" element={<QuestionPage />} />
      </Routes>,
      '/questions/1',
    );

  it('ne montre pas une réponse masquée aux autres membres', async () => {
    page();
    expect(await screen.findByRole('heading', { level: 1 })).toBeTruthy();
    expect(document.getElementById('answer-14')).toBeNull();
  });

  it('la montre à son auteur avec un avis, et lui permet de contester', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue({
      id: 9,
      name: 'Aminata Ouédraogo',
      email: 'aminata.ouedraogo@example.com',
      country: 'BF',
      city: 'Ouagadougou',
      photoUrl: null,
      reputation: 120,
      level: 'MEMBER',
      language: 'fr',
      skills: [],
      bio: null,
      recruiterVisible: false,
      providers: [],
      hasPassword: true,
      onboarded: true,
    });
    const create = vi.spyOn(appealsApi, 'create');
    page();

    const notice = await screen.findByRole('note');
    expect(notice.textContent).toContain('Hors sujet');
    expect(notice.textContent).toContain('Vous êtes seul à le voir.');

    fireEvent.click(screen.getByRole('button', { name: 'Contester la décision' }));
    const textarea = screen.getByLabelText('Votre explication');
    fireEvent.change(textarea, { target: { value: 'Trop court' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la contestation' }));
    expect(await screen.findByText(/20 caractères au moins/)).toBeTruthy();
    expect(create).not.toHaveBeenCalled();

    const message = "Ma réponse propose une autre solution de paiement, c'est une piste utile.";
    fireEvent.change(textarea, { target: { value: message } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la contestation' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({ targetType: 'ANSWER', targetId: 14, message }),
    );
    expect(await screen.findByText(/l'équipe Zetsu l'examine/)).toBeTruthy();
  });
});
