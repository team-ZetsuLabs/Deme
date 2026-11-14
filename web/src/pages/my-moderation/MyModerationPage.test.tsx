import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import { ToastProvider } from '../../components/ToastProvider';
import { notificationLink } from '../../features/notifications/notificationsApi';
import MyModerationPage from './MyModerationPage';

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('MyModerationPage (MOD-3)', () => {
  it('montre le contenu masqué, le motif du Référent et le lien vers la réponse', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <MyModerationPage />
        </ToastProvider>
      </MemoryRouter>,
    );

    const link = await screen.findByRole('link', {
      name: "Utilisez le SDK officiel de Wave plutôt qu'un appel HTTP brut",
    });
    expect(link.getAttribute('href')).toBe('/questions/155#answer-690');
    expect(screen.getByText('Masqué')).toBeTruthy();
    expect(screen.getByRole('note').textContent).toContain('Lien commercial.');
    expect(screen.getByRole('button', { name: 'Contester la décision' })).toBeTruthy();
  });

  it('envoie les notifications de modération vers cette page', () => {
    const target = { type: 'ANSWER' as const, id: 690, title: 'Réponse', questionId: 155 };
    expect(notificationLink(target, 'CONTENT_HIDDEN')).toBe('/moderation');
    expect(notificationLink(target, 'ANSWER_POSTED')).toBe('/questions/155#answer-690');
  });
});
