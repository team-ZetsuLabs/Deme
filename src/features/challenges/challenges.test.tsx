import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import type { Challenge, Me } from '../../api/types';
import { ApiError } from '../../api/api';
import { ToastProvider } from '../../components/ToastProvider';
import ChallengesPage from '../../pages/challenges/ChallengesPage';
import { authApi } from '../auth/authApi';
import { SessionProvider } from '../auth/SessionProvider';
import { challengesApi, validateRepoUrl } from './challengesApi';
import { Flag } from '../../components/Flag';
import { remainingUntil } from './remaining';
import { demoMe } from '../../test/fixtures';

const member: Me = demoMe();

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

// Le défi de l'exemple se termine le 9 novembre 2026 : sans horloge figée pendant le
// défi, la page l'affiche « clôturé » dès que la vraie date passe et le test casse.
beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-11-05T12:00:00Z').getTime());
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
    // L'exemple du contrat a déjà un dépôt : on part d'un membre qui n'a rien soumis.
    const current = await import('../../mocks/GET_challenges_current.json');
    vi.spyOn(challengesApi, 'current').mockResolvedValue({
      ...(current.default as Challenge),
      mySubmission: null,
    });
    const submit = vi.spyOn(challengesApi, 'submit');
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Un menu USSD de paiement de facture' }),
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
        repositoryUrl: 'https://github.com/aminata-dev/api-paiement-mobile',
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
  it('affiche le drapeau en image, et rien pour « Autre »', () => {
    render(<Flag code="SN" label="Sénégal" />);
    expect(screen.getByRole('img', { name: 'Sénégal' }).getAttribute('src')).toBe('/flags/SN.svg');
    cleanup();
    const { container } = render(<Flag code="OTHER" />);
    expect(container.querySelector('img')).toBeNull();
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
    expect(table.textContent).toContain('Sénégal (votre pays)');
  });
});
