import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import i18n from '../../i18n';
import type { Me } from '../../api/types';
import { ToastProvider } from '../../components/ToastProvider';
import { authApi } from '../../features/auth/authApi';
import { SessionProvider } from '../../features/auth/SessionProvider';
import { useSession } from '../../features/auth/useSession';
import WelcomePage from './WelcomePage';
import { demoMe } from '../../test/fixtures';

const newMember: Me = demoMe({
  id: 57,
  username: 'koffi_m',
  displayName: 'Koffi Mensah',
  email: 'koffi.mensah@example.com',
  countryCode: 'TG',
  city: null,
  reputation: 1,
  level: 'NEWCOMER',
  onboardingCompleted: false,
});

/**
 * Comme dans l'appli réelle, on arrive sur /welcome une fois la session chargée
 * (après inscription), pas pendant : la page peut alors pré-remplir depuis le profil.
 */
function GateToWelcome() {
  const { status } = useSession();
  if (status === 'loading') return null;
  return <Navigate to="/welcome" replace state={{ from: '/questions' }} />;
}

const renderFlow = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <SessionProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<GateToWelcome />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/questions" element={<h1>Fil des questions</h1>} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("parcours d'accueil (AUTH-5)", () => {
  it('laisse le nouveau membre compléter son profil, puis le ramène où il allait', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(newMember);
    const complete = vi.spyOn(authApi, 'completeOnboarding');

    renderFlow();

    expect(await screen.findByText(/Bienvenue sur Dɛmɛ, Koffi/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'flutter' }));
    fireEvent.click(screen.getByRole('button', { name: 'mobile-money' }));
    fireEvent.click(screen.getByRole('button', { name: "C'est parti" }));

    expect(await screen.findByRole('heading', { name: 'Fil des questions' })).toBeTruthy();
    await waitFor(() =>
      expect(complete).toHaveBeenCalledWith({
        technologies: ['flutter', 'mobile-money'],
        countryCode: 'TG',
        language: 'fr',
      }),
    );
  });

  it('demande un pays avant de terminer, et « Plus tard » laisse passer', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue({ ...newMember, countryCode: null });
    const complete = vi.spyOn(authApi, 'completeOnboarding');
    renderFlow();

    fireEvent.click(await screen.findByRole('button', { name: "C'est parti" }));
    expect(await screen.findByText('Choisissez votre pays pour continuer.')).toBeTruthy();
    expect(complete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Plus tard' }));
    expect(await screen.findByRole('heading', { name: 'Fil des questions' })).toBeTruthy();
    expect(complete).not.toHaveBeenCalled();
  });

  it('ajoute une technologie saisie et refuse un nom invalide', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(newMember);
    renderFlow();

    const input = await screen.findByLabelText('Ajouter une autre technologie');
    fireEvent.change(input, { target: { value: 'Spring Boot' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(screen.getByRole('button', { name: 'spring-boot' }).getAttribute('aria-pressed')).toBe(
      'true',
    );

    fireEvent.change(input, { target: { value: '<script>' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(screen.getByText(/lettres minuscules/)).toBeTruthy();
  });
});
