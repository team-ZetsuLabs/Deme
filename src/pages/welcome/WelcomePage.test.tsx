import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../i18n';
import type { Me } from '../../api/types';
import { ToastProvider } from '../../components/ToastProvider';
import { authApi } from '../../features/auth/authApi';
import { OnboardingGuard } from '../../features/auth/OnboardingGuard';
import { SessionProvider } from '../../features/auth/SessionProvider';
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

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <ToastProvider>
          <Routes>
            <Route path="/welcome" element={<WelcomePage />} />
            <Route
              path="/questions"
              element={
                <OnboardingGuard>
                  <h1>Fil des questions</h1>
                </OnboardingGuard>
              }
            />
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
  it('envoie un nouveau membre vers /welcome, puis le ramène où il allait', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(newMember);
    const complete = vi.spyOn(authApi, 'completeOnboarding');

    renderAt('/questions');

    expect(await screen.findByText(/Bienvenue sur Zetsu, Koffi/)).toBeTruthy();
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
    renderAt('/questions');

    fireEvent.click(await screen.findByRole('button', { name: "C'est parti" }));
    expect(await screen.findByText('Choisissez votre pays pour continuer.')).toBeTruthy();
    expect(complete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Plus tard' }));
    expect(await screen.findByRole('heading', { name: 'Fil des questions' })).toBeTruthy();
    expect(complete).not.toHaveBeenCalled();
  });

  it('ajoute une technologie saisie et refuse un nom invalide', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(newMember);
    renderAt('/welcome');

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
