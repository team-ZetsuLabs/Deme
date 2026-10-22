import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import i18n from '../../i18n';
import { QuestionRowsSkeleton } from './QuestionRowsSkeleton';

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(cleanup);

describe('squelettes de chargement', () => {
  it('annoncent le chargement et masquent les blocs gris aux lecteurs d’écran', () => {
    render(<QuestionRowsSkeleton count={3} />);
    const region = screen.getByRole('status');
    expect(region.getAttribute('aria-busy')).toBe('true');
    expect(region.textContent).toBe('Chargement en cours');
    expect(region.querySelector('[aria-hidden="true"]')?.children).toHaveLength(3);
  });
});
