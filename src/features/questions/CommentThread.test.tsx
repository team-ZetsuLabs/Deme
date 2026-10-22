import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../i18n';
import { ToastProvider } from '../../components/ToastProvider';
import QuestionPage from '../../pages/question/QuestionPage';
import { authApi } from '../auth/authApi';
import { SessionProvider } from '../auth/SessionProvider';
import { questionsApi } from './questionsApi';

const renderQuestion = () =>
  render(
    <MemoryRouter initialEntries={['/questions/1']}>
      <SessionProvider>
        <ToastProvider>
          <Routes>
            <Route path="/questions/:id" element={<QuestionPage />} />
            <Route path="/login" element={<p>Page de connexion</p>} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );

const signIn = () =>
  vi.spyOn(authApi, 'me').mockResolvedValue({
    id: 9,
    name: 'Aminata Ouédraogo',
    email: 'aminata.ouedraogo@example.com',
    country: 'BF',
    city: 'Ouagadougou',
    photoUrl: null,
    bio: null,
    reputation: 120,
    level: 'MEMBER',
    language: 'fr',
    skills: [],
    recruiterVisible: false,
    providers: [],
    hasPassword: true,
    onboarded: true,
  });

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Commentaires (QA-9)', () => {
  it('montre 3 commentaires et déplie les autres', async () => {
    renderQuestion();
    await screen.findByRole('heading', { level: 1 });
    const answer = document.getElementById('answer-11') as HTMLElement;
    const list = within(answer).getByRole('list', { name: 'Commentaires' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);

    fireEvent.click(within(answer).getByRole('button', { name: 'Voir 1 autre commentaire' }));
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('envoie vers la connexion si on n’est pas connecté', async () => {
    renderQuestion();
    await screen.findByRole('heading', { level: 1 });
    fireEvent.click(screen.getAllByRole('button', { name: 'Ajouter un commentaire' })[0]);
    expect(await screen.findByText('Page de connexion')).toBeTruthy();
  });

  it('refuse un commentaire trop court, puis publie le commentaire', async () => {
    signIn();
    const comment = vi.spyOn(questionsApi, 'comment').mockResolvedValue({
      id: 990,
      body: 'Quelle version du SDK Orange Money utilises-tu ?',
      author: {
        id: 9,
        name: 'Aminata Ouédraogo',
        photoUrl: null,
        country: 'BF',
        city: 'Ouagadougou',
        reputation: 120,
      },
      createdAt: '2026-10-22T12:00:00Z',
    });
    renderQuestion();
    await screen.findByRole('heading', { level: 1 });
    // Le premier fil est celui de la question.
    fireEvent.click(screen.getAllByRole('button', { name: 'Ajouter un commentaire' })[0]);

    const field = screen.getByLabelText('Votre commentaire');
    fireEvent.change(field, { target: { value: 'Merci' } });
    fireEvent.click(screen.getByRole('button', { name: 'Commenter' }));
    expect(await screen.findByText('Écrivez au moins 10 caractères.')).toBeTruthy();
    expect(comment).not.toHaveBeenCalled();

    fireEvent.change(field, {
      target: { value: 'Quelle version du SDK Orange Money utilises-tu ?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Commenter' }));
    await waitFor(() =>
      expect(comment).toHaveBeenCalledWith(
        'question',
        1,
        'Quelle version du SDK Orange Money utilises-tu ?',
      ),
    );
    expect(
      await screen.findByText('Quelle version du SDK Orange Money utilises-tu ?'),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Votre commentaire')).toBeNull();
  });

  it('affiche un commentaire piégé comme du texte', async () => {
    signIn();
    vi.spyOn(questionsApi, 'comment').mockResolvedValue({
      id: 991,
      body: '<img src=x onerror=alert(1)> regarde ça',
      author: {
        id: 9,
        name: 'Aminata Ouédraogo',
        photoUrl: null,
        country: 'BF',
        city: 'Ouagadougou',
        reputation: 120,
      },
      createdAt: '2026-10-22T12:00:00Z',
    });
    renderQuestion();
    await screen.findByRole('heading', { level: 1 });
    fireEvent.click(screen.getAllByRole('button', { name: 'Ajouter un commentaire' })[0]);
    fireEvent.change(screen.getByLabelText('Votre commentaire'), {
      target: { value: '<img src=x onerror=alert(1)> regarde ça' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Commenter' }));
    expect(await screen.findByText('<img src=x onerror=alert(1)> regarde ça')).toBeTruthy();
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });
});
