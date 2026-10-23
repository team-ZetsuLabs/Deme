import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '../../i18n';
import type { Me } from '../../api/types';
import { safeUrl } from '../../components/safeUrl';
import { ToastProvider } from '../../components/ToastProvider';
import JobPage from '../../pages/job/JobPage';
import { authApi } from '../auth/authApi';
import { SessionProvider } from '../auth/SessionProvider';
import { JobForm } from './JobForm';
import { jobsApi } from './jobsApi';
import { cvError, validateWebsite } from './validation';
import { demoMe } from '../../test/fixtures';

const member: Me = demoMe({
  skills: ['spring-boot', 'docker', 'flutter'],
  visibleToRecruiters: true,
});

const wrap = (ui: ReactNode, path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <ToastProvider>{ui}</ToastProvider>
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

describe('règles de sécurité des liens et fichiers', () => {
  it('ne garde que les adresses http(s)', () => {
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeUrl('https://sahel-paiements.example')).toBe('https://sahel-paiements.example/');
    expect(validateWebsite('http://entreprise.example')).toBe('jobs.new.errors.website');
    expect(validateWebsite('')).toBeNull();
  });

  it('accepte seulement un CV PDF de 2 Mo au plus', () => {
    expect(cvError(new File(['x'], 'cv.docx', { type: 'application/msword' }))).toBe(
      'jobs.apply.cvType',
    );
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'cv.pdf', {
      type: 'application/pdf',
    });
    expect(cvError(big)).toBe('jobs.apply.cvSize');
    expect(cvError(new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' }))).toBeNull();
  });
});

describe('JobPage (JOB-2, JOB-3)', () => {
  const renderJob = () =>
    wrap(
      <Routes>
        <Route path="/jobs/:id" element={<JobPage />} />
      </Routes>,
      '/jobs/1',
    );

  it('compare la stack du membre aux technologies demandées', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    renderJob();
    expect(await screen.findByText('2 technologies sur 4 dans votre profil.')).toBeTruthy();
  });

  it('envoie une candidature avec un message assez long', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    const apply = vi.spyOn(jobsApi, 'apply');
    renderJob();

    fireEvent.click(await screen.findByRole('button', { name: 'Postuler' }));
    const message = screen.getByLabelText(/^Message au recruteur/);
    fireEvent.change(message, { target: { value: 'Trop court' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer ma candidature' }));
    expect(await screen.findByText(/au moins 40 caractères/)).toBeTruthy();
    expect(apply).not.toHaveBeenCalled();

    const text = "J'ai intégré Orange Money dans deux applications Spring Boot en production.";
    fireEvent.change(message, { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer ma candidature' }));
    await waitFor(() => expect(apply).toHaveBeenCalledWith(1, { message: text, cv: null }));
    expect(await screen.findByRole('heading', { name: 'Candidature envoyée' })).toBeTruthy();
  });
});

describe('JobForm (JOB-4)', () => {
  it('refuse un site sans https, puis envoie l’offre', async () => {
    const create = vi.spyOn(jobsApi, 'create');
    const onCreated = vi.fn();
    wrap(<JobForm onCreated={onCreated} />);

    const type = (label: RegExp, value: string) =>
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    type(/^Intitulé du poste/, 'Développeur Flutter confirmé');
    type(/^Entreprise/, 'AgriLien');
    type(/^Site de l'entreprise/, 'http://agrilien.example');
    type(/^Technologies/, 'Flutter, Firebase');
    type(
      /^Description du poste/,
      "AgriLien met en relation producteurs et acheteurs agricoles. Vous ferez évoluer l'application Flutter et son mode hors ligne.",
    );
    fireEvent.click(screen.getByRole('button', { name: "Envoyer l'offre pour validation" }));
    expect(await screen.findByText(/commence par https/)).toBeTruthy();
    expect(create).not.toHaveBeenCalled();

    type(/^Site de l'entreprise/, 'https://agrilien.example');
    fireEvent.click(screen.getByRole('button', { name: "Envoyer l'offre pour validation" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        company: { name: 'AgriLien', website: 'https://agrilien.example' },
        technologies: ['flutter', 'firebase'],
        contractType: 'FULL_TIME',
      }),
    );
  });
});
