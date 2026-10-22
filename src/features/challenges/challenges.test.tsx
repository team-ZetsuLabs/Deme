import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import type { Me } from '../../api/provisional-types';
import { ApiError } from '../../api/api';
import { ToastProvider } from '../../components/ToastProvider';
import ChallengesPage from '../../pages/challenges/ChallengesPage';
import { authApi } from '../auth/authApi';
import { SessionProvider } from '../auth/SessionProvider';
import { challengesApi, validateRepoUrl } from './challengesApi';
import { flagOf } from './flag';
import { remainingUntil } from './remaining';

const member: Me = {
  id: 9,
  name: 'Aminata Ouédraogo',
  email: 'aminata.ouedraogo@example.com',
  country: 'BF',
  city: 'Ouagadougou',
  photoUrl: null,
  bio: null,
  reputation: 120,
  level: 'MEMBER',
  language: 'fr',
  skills: [],
  recruiterVisible: false,
  providers: [],
  hasPassword: true,
  onboarded: true,
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/challenges']}>
      <SessionProvider>
        <ToastProvider>
          <ChallengesPage />
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

describe('compte à rebours (CH-1)', () => {
  it('se calcule depuis la fin enregistrée du défi', () => {
    const now = new Date('2026-10-21T12:00:00Z').getTime();
    expect(remainingUntil('2026-10-23T15:30:00Z', now)).toEqual({
      days: 2,
      hours: 3,
      minutes: 30,
      ended: false,
    });
    expect(remainingUntil('2026-10-20T00:00:00Z', now).ended).toBe(true);
  });
});

describe('lien de dépôt (CH-2)', () => {
  it('accepte seulement un dépôt GitHub public au bon format', () => {
    expect(validateRepoUrl('https://github.com/aminata-dev/api-paiement')).toBeNull();
    expect(validateRepoUrl('https://github.com/aminata-dev/api-paiement/')).toBeNull();
    expect(validateRepoUrl('http://github.com/aminata-dev/api')).not.toBeNull();
    expect(validateRepoUrl('https://gitlab.com/aminata-dev/api')).not.toBeNull();
    expect(validateRepoUrl('https://github.com/aminata-dev')).not.toBeNull();
    expect(validateRepoUrl('javascript:alert(1)')).not.toBeNull();
  });
});

describe('ChallengesPage', () => {
  it('affiche le défi, le classement et enregistre un dépôt', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    const submit = vi.spyOn(challengesApi, 'submit');
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Simuler une API de paiement mobile' }),
    ).toBeTruthy();
    expect(await screen.findByRole('link', { name: 'Kwame Asante' })).toBeTruthy();
    expect(screen.getByText('92/100')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Soumettre mon dépôt' }));
    const input = screen.getByLabelText(/^Lien du dépôt GitHub/);
    fireEvent.change(input, { target: { value: 'https://gitlab.com/moi/api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Soumettre' }));
    expect(await screen.findByText(/github\.com\/compte\/depot/)).toBeTruthy();

    fireEvent.change(input, {
      target: { value: 'https://github.com/aminata-dev/api-paiement-mobile' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Soumettre' }));
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith(4, {
        repoUrl: 'https://github.com/aminata-dev/api-paiement-mobile',
      }),
    );
    expect(await screen.findByText('Dépôt reçu, en attente de notation')).toBeTruthy();
  });

  it("indique qu'il n'y a pas de défi en cours", async () => {
    vi.spyOn(challengesApi, 'current').mockRejectedValue(
      new ApiError(404, { code: 'NO_CURRENT_CHALLENGE', message: 'none' }),
    );
    renderPage();
    expect(await screen.findByText(/Pas de défi en cours/)).toBeTruthy();
  });
});

describe('classement par pays (CH-5)', () => {
  it('donne le drapeau à partir du code du pays', () => {
    expect(flagOf('SN')).toBe('\u{1F1F8}\u{1F1F3}');
    expect(flagOf('OTHER')).toBe('');
  });

  it('bascule du classement des membres à celui des pays', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    const countries = vi.spyOn(challengesApi, 'countryLeaderboard');
    renderPage();
    await screen.findByRole('table', { name: /Classement du défi/ });
    expect(countries).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Pays' }));
    const table = await screen.findByRole('table', {
      name: 'Classement par pays du défi en cours',
    });
    const rows = table.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('Sénégal');
    expect(rows[0].textContent).toContain('4 participants');
    // Le pays du membre connecté est repéré.
    expect(table.textContent).toContain('Burkina Faso (votre pays)');
  });
});
