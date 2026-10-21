import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../i18n';
import { ToastProvider } from '../../components/ToastProvider';
import { SessionProvider } from '../../features/auth/SessionProvider';
import ProfilePage from './ProfilePage';

const renderProfile = () =>
  render(
    <MemoryRouter initialEntries={['/users/9']}>
      <SessionProvider>
        <ToastProvider>
          <Routes>
            <Route path="/users/:id" element={<ProfilePage />} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(cleanup);

describe('ProfilePage (REP-5)', () => {
  it('affiche la réputation, le niveau et la progression', async () => {
    renderProfile();
    expect(await screen.findByRole('heading', { name: 'Aminata Ouédraogo' })).toBeTruthy();
    expect(screen.getByText('Membre')).toBeTruthy();
    expect(screen.getByText('Encore 380 points avant le niveau Contributeur')).toBeTruthy();
    expect(screen.getByText('Visible par les recruteurs')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('120');
  });

  it('change d’onglet au clavier', async () => {
    renderProfile();
    const activity = await screen.findByRole('tab', { name: 'Activité' });
    activity.focus();
    fireEvent.keyDown(activity, { key: 'ArrowRight' });
    const skills = screen.getByRole('tab', { name: 'Compétences' });
    expect(skills.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(skills);
    expect(screen.getByRole('link', { name: 'mobile-money' })).toBeTruthy();
  });
});
