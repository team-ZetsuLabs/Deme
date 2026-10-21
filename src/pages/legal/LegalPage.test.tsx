import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import LegalPage from './LegalPage';

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(cleanup);

describe('LegalPage', () => {
  it('affiche les règles avec un sommaire relié aux sections', () => {
    render(
      <MemoryRouter>
        <LegalPage doc="rules" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Règles de la communauté' })).toBeTruthy();
    const tocLink = screen.getByRole('link', { name: 'Signalements et modération' });
    const target = document.querySelector(tocLink.getAttribute('href') ?? '');
    expect(target?.textContent).toContain('5 signalements');
    expect(
      screen.getByRole('link', { name: 'Règles de la communauté' }).getAttribute('aria-current'),
    ).toBe('page');
  });

  it('a les mêmes sections en français et en anglais', async () => {
    for (const doc of ['rules', 'terms', 'privacy'] as const) {
      const fr = i18n.getFixedT('fr')(`legal.${doc}.sections`, { returnObjects: true });
      const en = i18n.getFixedT('en')(`legal.${doc}.sections`, { returnObjects: true });
      expect(Array.isArray(fr) && Array.isArray(en) && fr.length === en.length).toBe(true);
    }
  });
});
