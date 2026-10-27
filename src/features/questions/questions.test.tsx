import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import i18n from '../../i18n';
import { ToastProvider } from '../../components/ToastProvider';
import { authApi } from '../auth/authApi';
import { appealsApi } from '../moderation/appealsApi';
import { HiddenNotice } from '../moderation/HiddenNotice';
import type { Answer, MyModeratedContent, Page } from '../../api/types';
import answersMock from '../../mocks/GET_questions_id_answers.json';
import { author, demoMe } from '../../test/fixtures';
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
      context: {
        countryCode: 'BF',
        mobileMoneyOperator: 'ORANGE_MONEY',
        networkQuality: 'UNSTABLE',
        techVersion: null,
      },
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

/** Réponses de l'exemple officiel (question 101 : 512 acceptée, 518 de Njeri), modifiables par test. */
const answersPage = (change: (answers: Answer[]) => Answer[]): Page<Answer> => {
  const page = structuredClone(answersMock) as Page<Answer>;
  return { ...page, items: change(page.items) };
};

const renderQuestion = () =>
  wrap(
    <Routes>
      <Route path="/questions/:id" element={<QuestionPage />} />
    </Routes>,
    '/questions/101',
  );

describe('QuestionPage', () => {
  it('affiche la question et ses réponses, la réponse acceptée en tête', async () => {
    renderQuestion();
    expect(await screen.findByRole('heading', { level: 1 })).toBeTruthy();
    const answers = document.querySelectorAll('article[id^="answer-"]');
    expect(answers).toHaveLength(2);
    expect(answers[0].id).toBe('answer-512');
    expect(answers[0].textContent).toContain('Réponse acceptée');
  });

  it("signale une réponse du même contexte, d'après le serveur (QA-10)", async () => {
    vi.spyOn(questionsApi, 'answers').mockResolvedValue(
      answersPage((items) => items.map((a) => (a.id === 518 ? { ...a, sameContext: true } : a))),
    );
    renderQuestion();
    await screen.findByRole('heading', { level: 1 });
    expect(document.getElementById('answer-518')?.textContent).toContain(
      'Même pays que la question',
    );
    expect(document.getElementById('answer-512')?.textContent).not.toContain(
      'Même pays que la question',
    );
  });
});

describe('QuestionPage, modification (QA-3)', () => {
  it('ne propose de modifier que les réponses que le serveur déclare modifiables', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(demoMe({ username: 'njeri_w' }));
    vi.spyOn(questionsApi, 'answers').mockResolvedValue(
      answersPage((items) => items.map((a) => ({ ...a, canEdit: a.id === 518 }))),
    );
    const body =
      'Ajoute une liste blanche des IP d’Orange sur le reverse proxy, et vérifie le statut.';
    const update = vi.spyOn(questionsApi, 'updateAnswer').mockResolvedValue({
      ...(answersMock.items[1] as Answer),
      bodyMarkdown: body,
      bodyHtml: `<p>${body}</p>`,
      canEdit: true,
    });
    renderQuestion();

    const edit = await screen.findByRole('button', { name: 'Modifier' });
    expect(screen.getAllByRole('button', { name: 'Modifier' })).toHaveLength(1);
    fireEvent.click(edit);

    const textarea = screen.getByLabelText(/^Votre réponse/, { selector: '#edit-518-body' });
    expect((textarea as HTMLTextAreaElement).value).toContain('liste blanche des IP');
    fireEvent.change(textarea, { target: { value: body } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la modification' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith(518, expect.any(Object)));
    expect(await screen.findByText(/et vérifie le statut/)).toBeTruthy();
  });
});

describe('QuestionPage, vote (QA-4)', () => {
  it('envoie un vote positif et affiche le score renvoyé', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(demoMe({ username: 'koffi_m' }));
    const vote = vi.spyOn(questionsApi, 'vote').mockResolvedValue({ score: 3, myVote: 1 });
    renderQuestion();
    await screen.findByRole('heading', { level: 1 });
    const answer = document.getElementById('answer-518') as HTMLElement;
    fireEvent.click(answer.querySelector('button[aria-pressed]') as HTMLButtonElement);
    await waitFor(() => expect(vote).toHaveBeenCalledWith('answer', 518));
    expect(answer.querySelector('button[aria-pressed="true"]')).toBeTruthy();
  });

  it('refuse de voter pour son propre contenu sans appeler le serveur', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(demoMe({ username: 'njeri_w' }));
    const vote = vi.spyOn(questionsApi, 'vote');
    renderQuestion();
    await screen.findByRole('heading', { level: 1 });
    const answer = document.getElementById('answer-518') as HTMLElement;
    fireEvent.click(answer.querySelector('button[aria-pressed]') as HTMLButtonElement);
    expect(
      await screen.findByText('Vous ne pouvez pas voter pour votre propre contenu.'),
    ).toBeTruthy();
    expect(vote).not.toHaveBeenCalled();
  });
});

describe('HiddenNotice (MOD-3)', () => {
  it("permet à l'auteur de contester le masquage, une seule fois", async () => {
    const item: MyModeratedContent = {
      caseId: 21,
      target: {
        type: 'ANSWER',
        id: 690,
        title: 'Utilisez le SDK officiel de Wave',
        questionId: 155,
        author: author(),
      },
      status: 'HIDDEN',
      decision: { action: 'HIDE', byTeam: false, decidedAt: '2026-10-22T09:00:00Z' },
      canAppeal: true,
      updatedAt: '2026-10-22T09:00:00Z',
    };
    const create = vi
      .spyOn(appealsApi, 'create')
      .mockResolvedValue({ ...item, status: 'APPEALED', canAppeal: false });
    const Notice = () => {
      const [current, setCurrent] = useState(item);
      return <HiddenNotice item={current} onAppealed={setCurrent} />;
    };
    wrap(<Notice />);

    const notice = screen.getByRole('note');
    expect(notice.textContent).toContain('Un Référent a masqué ce contenu.');
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
    await waitFor(() => expect(create).toHaveBeenCalledWith(21, message));
    expect(await screen.findByText(/l'équipe Zetsu l'examine/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Contester la décision' })).toBeNull();
  });
});
