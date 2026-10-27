import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '../../i18n';
import { ApiError } from '../../api/api';
import { authApi } from './authApi';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { SessionProvider } from './SessionProvider';

const wrap = (ui: ReactNode) =>
  render(
    <MemoryRouter>
      <SessionProvider>{ui}</SessionProvider>
    </MemoryRouter>,
  );

const type = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

/** Le pays se choisit dans une liste avec drapeaux (CountrySelect), pas dans un <select>. */
const chooseCountry = (name: string) => {
  fireEvent.click(screen.getByRole('combobox', { name: /^Pays/ }));
  fireEvent.click(screen.getByRole('option', { name }));
};

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('RegisterForm', () => {
  it("affiche les erreurs et met le focus sur le premier champ, sans appeler l'API", async () => {
    const register = vi.spyOn(authApi, 'register');
    wrap(<RegisterForm onSignedIn={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    expect(await screen.findByText(/entre 3 et 40 caractères/)).toBeTruthy();
    expect(screen.getByText(/adresse email valide/)).toBeTruthy();
    expect(screen.getByText('Choisissez votre pays.')).toBeTruthy();
    expect(screen.getByLabelText(/^Nom complet/).getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(screen.getByLabelText(/^Nom complet/));
    expect(register).not.toHaveBeenCalled();
  });

  it('refuse un mot de passe sans chiffre', async () => {
    wrap(<RegisterForm onSignedIn={vi.fn()} />);
    type(/^Mot de passe/, 'motdepasse');
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(
      await screen.findByText(/au moins 8 caractères, avec au moins un chiffre\.$/),
    ).toBeTruthy();
  });

  it('envoie le formulaire valide, avec le champ piège vide', async () => {
    const onSignedIn = vi.fn();
    const register = vi.spyOn(authApi, 'register');
    wrap(<RegisterForm onSignedIn={onSignedIn} />);

    type(/^Nom complet/, '  Koffi Mensah ');
    type(/^Adresse email/, 'koffi.mensah@example.com');
    chooseCountry('Togo');
    type(/^Mot de passe/, 'lome2026');
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    await waitFor(() => expect(onSignedIn).toHaveBeenCalled());
    expect(register).toHaveBeenCalledWith({
      displayName: 'Koffi Mensah',
      email: 'koffi.mensah@example.com',
      countryCode: 'TG',
      password: 'lome2026',
    });
  });

  it("n'envoie rien quand le champ piège est rempli (robot)", async () => {
    const register = vi.spyOn(authApi, 'register');
    wrap(<RegisterForm onSignedIn={vi.fn()} />);
    type(/^Nom complet/, 'Koffi Mensah');
    type(/^Adresse email/, 'koffi.mensah@example.com');
    chooseCountry('Togo');
    type(/^Mot de passe/, 'lome2026');
    fireEvent.change(document.getElementById('register-website') as HTMLInputElement, {
      target: { value: 'https://spam.example' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(register).not.toHaveBeenCalled();
  });

  it('affiche les erreurs de champ renvoyées par le serveur', async () => {
    vi.spyOn(authApi, 'register').mockRejectedValue(
      new ApiError(409, {
        code: 'EMAIL_TAKEN',
        message: 'Email déjà utilisé',
        fields: { email: 'Adresse indisponible', displayName: 'Nom refusé' },
      }),
    );
    wrap(<RegisterForm onSignedIn={vi.fn()} />);
    type(/^Nom complet/, 'Koffi Mensah');
    type(/^Adresse email/, 'koffi.mensah@example.com');
    chooseCountry('Togo');
    type(/^Mot de passe/, 'lome2026');
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toMatch(/ne peut pas être utilisée/);
    expect(screen.getByText('Adresse indisponible')).toBeTruthy();
    // Le champ displayName du contrat s'affiche sous « Nom complet ».
    expect(screen.getByText('Nom refusé')).toBeTruthy();
  });

  it("affiche un nom piégé comme du texte, sans l'exécuter", () => {
    wrap(<RegisterForm onSignedIn={vi.fn()} />);
    type(/^Nom complet/, '<img src=x onerror=alert(1)>');
    expect(document.querySelector('img')).toBeNull();
  });
});

describe('LoginForm', () => {
  it('affiche le message traduit quand les identifiants sont faux', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(
      new ApiError(401, { code: 'INVALID_CREDENTIALS', message: 'Bad credentials' }),
    );
    wrap(<LoginForm onSignedIn={vi.fn()} />);
    type(/^Adresse email/, 'aminata.ouedraogo@example.com');
    type(/^Mot de passe/, 'faux-mot-de-passe1');
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Email ou mot de passe incorrect.');
  });

  it('connecte le membre avec des identifiants valides', async () => {
    const onSignedIn = vi.fn();
    wrap(<LoginForm onSignedIn={onSignedIn} />);
    type(/^Adresse email/, 'aminata.ouedraogo@example.com');
    type(/^Mot de passe/, 'ouaga2026');
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    await waitFor(() => expect(onSignedIn).toHaveBeenCalled());
  });
});
