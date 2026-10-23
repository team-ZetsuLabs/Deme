import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '../../i18n';
import { ApiError } from '../../api/api';
import type { Me } from '../../api/types';
import { ToastProvider } from '../../components/ToastProvider';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { EmailVerifyBanner } from '../../layout/EmailVerifyBanner';
import ForgotPasswordPage from '../../pages/forgot-password/ForgotPasswordPage';
import ResetPasswordPage from '../../pages/reset-password/ResetPasswordPage';
import VerifyEmailPage from '../../pages/verify-email/VerifyEmailPage';
import { authApi } from './authApi';
import { SessionProvider } from './SessionProvider';
import { demoMe } from '../../test/fixtures';

const ME: Me = demoMe({ emailVerified: false });

const renderAt = (path: string, element: ReactNode, route: string) =>
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <SessionProvider>
          <ToastProvider>
            <Routes>
              <Route path={route} element={element} />
              <Route path="/login" element={<p>Page de connexion</p>} />
            </Routes>
          </ToastProvider>
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );

const type = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Mot de passe oublié (AUTH-4)', () => {
  it("valide l'adresse, puis répond sans dire si le compte existe", async () => {
    const request = vi.spyOn(authApi, 'requestPasswordReset');
    renderAt('/forgot-password', <ForgotPasswordPage />, '/forgot-password');

    type(/^Adresse email|^Email/, 'aminata');
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));
    expect(await screen.findByText(/adresse email valide/)).toBeTruthy();
    expect(request).not.toHaveBeenCalled();

    type(/^Adresse email|^Email/, 'aminata.ouedraogo@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));
    expect(await screen.findByText(/Si un compte Zetsu existe pour/)).toBeTruthy();
    expect(request).toHaveBeenCalledWith('aminata.ouedraogo@example.com');
  });
});

describe('Nouveau mot de passe (AUTH-4)', () => {
  it('exige deux mots de passe identiques, puis renvoie vers la connexion', async () => {
    const reset = vi.spyOn(authApi, 'resetPassword');
    renderAt('/reset-password?token=abc123', <ResetPasswordPage />, '/reset-password');

    type(/^Nouveau mot de passe/, 'ouaga2026');
    type(/^Confirmez le mot de passe/, 'ouaga2025');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le mot de passe' }));
    expect(await screen.findByText('Les deux mots de passe ne sont pas identiques.')).toBeTruthy();
    expect(reset).not.toHaveBeenCalled();

    type(/^Confirmez le mot de passe/, 'ouaga2026');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le mot de passe' }));
    expect(await screen.findByText('Page de connexion')).toBeTruthy();
    expect(reset).toHaveBeenCalledWith('abc123', 'ouaga2026');
  });

  it('propose un nouveau lien quand celui-ci a expiré', async () => {
    vi.spyOn(authApi, 'resetPassword').mockRejectedValue(
      new ApiError(400, { code: 'RESET_TOKEN_EXPIRED', message: 'Lien expiré' }),
    );
    renderAt('/reset-password?token=abc123', <ResetPasswordPage />, '/reset-password');
    type(/^Nouveau mot de passe/, 'ouaga2026');
    type(/^Confirmez le mot de passe/, 'ouaga2026');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le mot de passe' }));
    expect(await screen.findByRole('heading', { name: "Ce lien n'est plus valable" })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Demander un nouveau lien' })).toBeTruthy();
  });

  it('refuse un lien sans jeton', () => {
    renderAt('/reset-password', <ResetPasswordPage />, '/reset-password');
    expect(screen.getByRole('heading', { name: "Ce lien n'est plus valable" })).toBeTruthy();
  });
});

describe("Vérification de l'email (AUTH-4)", () => {
  it("confirme l'adresse avec le jeton du lien", async () => {
    const verify = vi.spyOn(authApi, 'verifyEmail');
    renderAt('/verify-email?token=xyz', <VerifyEmailPage />, '/verify-email');
    expect(await screen.findByRole('heading', { name: 'Adresse confirmée' })).toBeTruthy();
    expect(verify).toHaveBeenCalledWith('xyz');
  });

  it('propose de renvoyer un email quand le lien a expiré', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(ME);
    vi.spyOn(authApi, 'verifyEmail').mockRejectedValue(
      new ApiError(400, { code: 'VERIFY_TOKEN_EXPIRED', message: 'Lien expiré' }),
    );
    const resend = vi.spyOn(authApi, 'resendVerification');
    renderAt('/verify-email?token=xyz', <VerifyEmailPage />, '/verify-email');
    fireEvent.click(await screen.findByRole('button', { name: "Renvoyer l'email" }));
    await waitFor(() => expect(resend).toHaveBeenCalled());
    expect(await screen.findByRole('button', { name: 'Email envoyé' })).toBeTruthy();
  });

  it("rappelle de confirmer l'adresse tant qu'elle ne l'est pas", async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(ME);
    renderAt('/', <EmailVerifyBanner />, '/');
    expect(await screen.findByText(/Confirmez votre adresse aminata/)).toBeTruthy();
  });
});
