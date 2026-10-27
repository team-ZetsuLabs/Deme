import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import { SessionProvider } from '../../features/auth/SessionProvider';
import { jobsApi } from '../../features/jobs/jobsApi';
import ApplicationsPage from './ApplicationsPage';

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ApplicationsPage (JOB-7)', () => {
  it('filtre par type et par statut, et le dit quand rien ne correspond', async () => {
    const list = vi.spyOn(jobsApi, 'myApplications');
    render(
      <MemoryRouter>
        <SessionProvider>
          <ApplicationsPage />
        </SessionProvider>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Missions' }));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(0, { type: 'MISSION', status: 'all' }),
    );

    list.mockResolvedValue({ items: [], page: 0, size: 20, total: 0 });
    fireEvent.change(screen.getByLabelText('Statut'), { target: { value: 'SHORTLISTED' } });
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(0, { type: 'MISSION', status: 'SHORTLISTED' }),
    );
    expect(await screen.findByText('Aucune candidature ne correspond à ces filtres.')).toBeTruthy();
  });
});
