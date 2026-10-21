import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../i18n';
import type { Me } from '../../api/provisional-types';
import { ToastProvider } from '../../components/ToastProvider';
import { authApi } from '../../features/auth/authApi';
import { OnboardingGuard } from '../../features/auth/OnboardingGuard';
import { SessionProvider } from '../../features/auth/SessionProvider';
import WelcomePage from './WelcomePage';

const newMember: Me = {
  id: 57,
  name: 'Koffi Mensah',
  email: 'koffi.mensah@example.com',
  country: 'TG',
  city: null,
  photoUrl: null,
  reputation: 1,
  level: 'NEW',
  language: 'fr',
  skills: [],
  bio: null,
  recruiterVisible: false,
  providers: [],
  hasPassword: true,
  onboarded: false,
};

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
    const updateMe = vi
      .spyOn(authApi, 'updateMe')
      .mockImplementation(async (body) => ({ ...newMember, ...body }) as Me);

    renderAt('/questions');

    expect(await screen.findByText(/Bienvenue sur Zetsu, Koffi/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'flutter' }));
    fireEvent.click(screen.getByRole('button', { name: 'mobile-money' }));
    fireEvent.click(screen.getByRole('button', { name: "C'est parti" }));

    expect(await screen.findByRole('heading', { name: 'Fil des questions' })).toBeTruthy();
    await waitFor(() =>
      expect(updateMe).toHaveBeenCalledWith({
        skills: ['flutter', 'mobile-money'],
        country: 'TG',
        language: 'fr',
        onboarded: true,
      }),
    );
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
