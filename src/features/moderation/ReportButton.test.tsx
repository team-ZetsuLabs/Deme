import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import type { Me } from '../../api/provisional-types';
import { ApiError } from '../../api/api';
import { ToastProvider } from '../../components/ToastProvider';
import { authApi } from '../auth/authApi';
import { SessionProvider } from '../auth/SessionProvider';
import { ReportButton } from './ReportButton';
import { reportsApi } from './reportsApi';

const member: Me = {
  id: 9,
  name: 'Aminata Ouédraogo',
  email: 'aminata.ouedraogo@example.com',
  country: 'BF',
  city: 'Ouagadougou',
  photoUrl: null,
  reputation: 120,
  level: 'MEMBER',
  language: 'fr',
  skills: [],
  bio: null,
  recruiterVisible: false,
  providers: [],
  hasPassword: true,
  onboarded: true,
};

const renderButton = (authorId = 2) =>
  render(
    <MemoryRouter>
      <SessionProvider>
        <ToastProvider>
          <ReportButton targetType="ANSWER" targetId={12} authorId={authorId} />
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

describe('ReportButton (MOD-1)', () => {
  it('envoie le motif choisi et la précision', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    const create = vi.spyOn(reportsApi, 'create').mockResolvedValue(undefined);
    renderButton();

    fireEvent.click(await screen.findByRole('button', { name: 'Signaler' }));
    // Pas de motif « offre frauduleuse » pour une réponse.
    expect(screen.queryByLabelText('Offre frauduleuse')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));
    expect(screen.getByRole('alert').textContent).toBe('Choisissez un motif.');

    fireEvent.click(screen.getByLabelText('Spam ou publicité'));
    fireEvent.change(screen.getByLabelText(/^Précisions/), {
      target: { value: 'Lien vers un site de paris en ligne.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        targetType: 'ANSWER',
        targetId: 12,
        reason: 'SPAM',
        comment: 'Lien vers un site de paris en ligne.',
      }),
    );
    expect(await screen.findByText(/Signalement envoyé/)).toBeTruthy();
  });

  it('affiche le message traduit si le contenu est déjà signalé', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    vi.spyOn(reportsApi, 'create').mockRejectedValue(
      new ApiError(409, { code: 'ALREADY_REPORTED', message: 'Already reported' }),
    );
    renderButton();
    fireEvent.click(await screen.findByRole('button', { name: 'Signaler' }));
    fireEvent.click(screen.getByLabelText('Hors sujet'));
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));
    expect(await screen.findByText('Vous avez déjà signalé ce contenu.')).toBeTruthy();
  });

  it("n'apparaît pas sur son propre contenu", async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    renderButton(9);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Signaler' })).toBeNull());
  });

  it('refuse un membre sous le niveau Membre, avec une explication', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue({ ...member, reputation: 12, level: 'NEW' });
    const create = vi.spyOn(reportsApi, 'create');
    renderButton();
    fireEvent.click(await screen.findByRole('button', { name: 'Signaler' }));
    expect(await screen.findByText(/50 points de réputation/)).toBeTruthy();
    expect(create).not.toHaveBeenCalled();
  });
});
