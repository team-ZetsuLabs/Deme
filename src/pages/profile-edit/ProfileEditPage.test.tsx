import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../i18n';
import type { Me } from '../../api/types';
import { ToastProvider } from '../../components/ToastProvider';
import { authApi } from '../../features/auth/authApi';
import { SessionProvider } from '../../features/auth/SessionProvider';
import { photoError } from '../../features/profile/photo';
import ProfileEditPage from './ProfileEditPage';
import { demoMe } from '../../test/fixtures';

const member: Me = demoMe({ technologies: ['flutter'], countryCode: 'SN' });

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/profile/edit']}>
      <SessionProvider>
        <ToastProvider>
          <Routes>
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            <Route path="/users/:username" element={<h1>Profil public</h1>} />
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

describe('photo de profil (SET-1)', () => {
  it('refuse un mauvais type ou une image trop lourde', () => {
    expect(photoError(new File(['x'], 'cv.pdf', { type: 'application/pdf' }))).toBe(
      'settings.photo.badType',
    );
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'photo.png', {
      type: 'image/png',
    });
    expect(photoError(big)).toBe('settings.photo.tooBig');
    expect(photoError(new File(['x'], 'photo.webp', { type: 'image/webp' }))).toBeNull();
  });
});

describe('ProfileEditPage', () => {
  it('enregistre le profil, pays compris, puis revient au profil public', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    const update = vi.spyOn(authApi, 'updateMe');
    renderPage();

    const bio = await screen.findByLabelText(/^Présentation/);
    fireEvent.change(bio, { target: { value: 'Développeuse Flutter à Ouagadougou.' } });
    fireEvent.click(screen.getByRole('combobox', { name: /^Pays/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Burkina Faso' }));
    fireEvent.click(screen.getByLabelText(/Visible par les recruteurs/));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(expect.objectContaining({ username: 'aminata_dev' }), {
        displayName: 'Aminata Diallo',
        countryCode: 'BF',
        city: 'Dakar',
        bio: 'Développeuse Flutter à Ouagadougou.',
        technologies: ['flutter'],
        visibleToRecruiters: true,
      }),
    );
    expect(await screen.findByRole('heading', { name: 'Profil public' })).toBeTruthy();
  });
});
