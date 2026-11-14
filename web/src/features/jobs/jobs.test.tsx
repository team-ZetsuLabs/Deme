import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '../../i18n';
import type { JobDetail, Me } from '../../api/types';
import { safeUrl } from '../../components/safeUrl';
import { ToastProvider } from '../../components/ToastProvider';
import JobPage from '../../pages/job/JobPage';
import NewJobPage from '../../pages/job-new/NewJobPage';
import EditJobPage from '../../pages/job-edit/EditJobPage';
import { authApi } from '../auth/authApi';
import { SessionProvider } from '../auth/SessionProvider';
import { JobForm } from './JobForm';
import { jobsApi } from './jobsApi';
import { cvError, validateWebsite } from './validation';
import { demoMe } from '../../test/fixtures';

const member: Me = demoMe({
  technologies: ['spring-boot', 'docker', 'flutter'],
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
    // Exemple du contrat : java, spring-boot, postgresql.
    expect(await screen.findByText(/^1 technologie sur 3/)).toBeTruthy();
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
    await waitFor(() => expect(apply).toHaveBeenCalledWith(31, { message: text, cv: null }));
    expect(await screen.findByRole('heading', { name: 'Candidature envoyée' })).toBeTruthy();
  });
});

describe('JobPage, côté recruteur (JOB-7)', () => {
  // fatou_sow a publié l'offre 31 dans les exemples du contrat.
  const recruiter: Me = demoMe({ id: 8, username: 'fatou_sow', role: 'RECRUITER' });
  const renderJob = () =>
    wrap(
      <Routes>
        <Route path="/jobs/:id" element={<JobPage />} />
      </Routes>,
      '/jobs/31',
    );

  it('montre les candidatures reçues et permet de retenir un candidat', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(recruiter);
    const decide = vi.spyOn(jobsApi, 'decide');
    renderJob();

    expect(await screen.findByRole('heading', { name: 'Votre offre' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Postuler' })).toBeNull();
    expect(await screen.findByRole('link', { name: 'Aminata Diallo' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Voir le CV' }).getAttribute('href')).toBe(
      '/api/v1/applications/207/cv',
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Retenir la candidature (Aminata Diallo)' }),
    );
    await waitFor(() => expect(decide).toHaveBeenCalledWith(207, 'SHORTLISTED'));
  });

  it("clôture l'offre après confirmation", async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(recruiter);
    const close = vi.spyOn(jobsApi, 'close');
    renderJob();

    fireEvent.click(await screen.findByRole('button', { name: "Clôturer l'offre" }));
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Clôturer' }));
    await waitFor(() => expect(close).toHaveBeenCalledWith(31));
  });
});

describe('NewJobPage (JOB-4)', () => {
  it('explique à un membre sans rôle recruteur pourquoi il ne peut pas publier', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    wrap(<NewJobPage />);
    expect(await screen.findByText(/réservé aux comptes recruteurs/)).toBeTruthy();
    expect(screen.queryByLabelText(/^Intitulé du poste/)).toBeNull();
  });
});

describe('JobForm (JOB-4)', () => {
  it('refuse un site sans https, puis envoie l’offre', async () => {
    const create = vi.spyOn(jobsApi, 'create');
    const onCreated = vi.fn();
    wrap(<JobForm onSaved={onCreated} />);

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
        companyName: 'AgriLien',
        companyWebsite: 'https://agrilien.example',
        technologies: ['flutter', 'firebase'],
        type: 'PERMANENT',
      }),
    );
  });
});

describe('modifier une offre (JOB-4)', () => {
  it('pré-remplit le formulaire et envoie la modification', async () => {
    const job = (await import('../../mocks/GET_jobs_id.json')).default as JobDetail;
    const update = vi.spyOn(jobsApi, 'update');
    const onSaved = vi.fn();
    wrap(<JobForm initial={job} onSaved={onSaved} />);

    const title = screen.getByLabelText(/^Intitulé du poste/) as HTMLInputElement;
    expect(title.value).toBe(job.title);
    expect((screen.getByLabelText(/^Entreprise/) as HTMLInputElement).value).toBe('Sahel Pay');
    fireEvent.change(title, { target: { value: 'Développeur back-end Java senior' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et renvoyer en validation' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(update).toHaveBeenCalledWith(
      31,
      expect.objectContaining({
        title: 'Développeur back-end Java senior',
        companyName: 'Sahel Pay',
        technologies: ['java', 'spring-boot', 'postgresql'],
      }),
    );
  });

  it("refuse la modification à qui n'a pas publié l'offre", async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    wrap(
      <Routes>
        <Route path="/jobs/:id/edit" element={<EditJobPage />} />
      </Routes>,
      '/jobs/31/edit',
    );
    expect(await screen.findByText(/Seul le recruteur/)).toBeTruthy();
    expect(screen.queryByLabelText(/^Intitulé du poste/)).toBeNull();
  });
});
