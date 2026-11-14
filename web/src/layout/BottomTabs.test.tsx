import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { SessionProvider } from '../features/auth/SessionProvider';
import { BottomTabs } from './BottomTabs';

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const renderTabs = () =>
  render(
    <MemoryRouter initialEntries={['/feed']}>
      <SessionProvider>
        <BottomTabs />
      </SessionProvider>
    </MemoryRouter>,
  );

describe('BottomTabs (barre mobile)', () => {
  it('montre les espaces principaux et cache les autres sous « Plus »', () => {
    renderTabs();
    // Espaces mis en avant.
    expect(screen.getByRole('link', { name: 'Accueil' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Aide' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Emploi' })).toBeTruthy();
    // Un espace secondaire n'est pas visible tant que « Plus » est fermé.
    expect(screen.queryByRole('link', { name: 'Missions' })).toBeNull();
  });

  it('ouvre le menu « Plus » et révèle les autres espaces', () => {
    renderTabs();
    fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
    expect(screen.getByRole('link', { name: 'Missions' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Défis' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Communautés' })).toBeTruthy();
  });
});
