import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import type { QuestionSummary } from '../../api/types';
import { author } from '../../test/fixtures';
import { QuestionHoverCard } from './QuestionHoverCard';

const question: QuestionSummary = {
  id: 5,
  title: 'Intégrer Wave dans WooCommerce',
  excerpt: 'Le webhook de Wave ne déclenche jamais la validation de commande.',
  tags: ['wave', 'woocommerce'],
  context: { countryCode: 'SN', mobileMoneyOperator: 'WAVE', networkQuality: null },
  author: author(),
  score: 4,
  answerCount: 2,
  hasAcceptedAnswer: true,
  createdAt: '2026-10-20T10:00:00Z',
};

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('QuestionHoverCard', () => {
  it('affiche titre, extrait et contexte au survol, à partir des données en main', () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <QuestionHoverCard id={question.id} question={question}>
          <a href={`/questions/${question.id}`}>Voir la question</a>
        </QuestionHoverCard>
      </MemoryRouter>,
    );

    const wrap = screen.getByText('Voir la question').parentElement;
    if (!wrap) throw new Error('enveloppe introuvable');
    fireEvent.mouseEnter(wrap);
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.getByText('Intégrer Wave dans WooCommerce')).toBeTruthy();
    expect(screen.getByText(/webhook de Wave/)).toBeTruthy();
    expect(screen.getByText('Wave')).toBeTruthy();
  });
});
