import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../i18n';
import type { Me } from '../../api/provisional-types';
import { ToastProvider } from '../../components/ToastProvider';
import { authApi } from '../../features/auth/authApi';
import { SessionProvider } from '../../features/auth/SessionProvider';
import { groupByDate } from '../../features/notifications/groupByDate';
import { notificationsApi } from '../../features/notifications/notificationsApi';
import { UnreadProvider } from '../../features/notifications/UnreadProvider';
import { NotificationBell } from '../../layout/NotificationBell';
import NotificationsPage from './NotificationsPage';

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
    <MemoryRouter initialEntries={['/notifications']}>
      <SessionProvider>
        <ToastProvider>
          <UnreadProvider>
            <NotificationBell />
            <Routes>
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/questions/:id" element={<h1>Question</h1>} />
            </Routes>
          </UnreadProvider>
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

describe('groupByDate', () => {
  it("range les éléments en aujourd'hui, cette semaine et plus ancien", () => {
    const now = new Date('2026-10-21T15:00:00');
    const groups = groupByDate(
      [
        { createdAt: '2026-10-21T08:00:00' },
        { createdAt: '2026-10-18T08:00:00' },
        { createdAt: '2026-10-01T08:00:00' },
      ],
      now,
    );
    expect(groups.map((g) => g.group)).toEqual(['today', 'week', 'earlier']);
  });
});

describe('NotificationsPage (NOT-1)', () => {
  it('marque une notification comme lue en l’ouvrant et met à jour le compteur', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    const markRead = vi.spyOn(notificationsApi, 'markRead');
    renderPage();

    expect(
      await screen.findByRole('link', { name: 'Notifications, 3 non lues' }, { timeout: 3000 }),
    ).toBeTruthy();
    fireEvent.click(
      await screen.findByRole('link', {
        name: 'BeanCreationException au démarrage quand PostgreSQL tourne dans Docker',
      }),
    );

    await waitFor(() => expect(markRead).toHaveBeenCalledWith({ ids: [41] }));
    expect(
      await screen.findByRole('link', { name: 'Notifications, 2 non lues' }, { timeout: 3000 }),
    ).toBeTruthy();
  });

  it('marque tout comme lu', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    const markRead = vi.spyOn(notificationsApi, 'markRead');
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Tout marquer comme lu' }));
    await waitFor(() => expect(markRead).toHaveBeenCalledWith({ all: true }));
    expect(
      await screen.findByRole('link', { name: 'Notifications, 0 non lue' }, { timeout: 3000 }),
    ).toBeTruthy();
    expect(screen.queryByText('Non lue')).toBeNull();
  });
});
