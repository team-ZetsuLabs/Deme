import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '../../i18n';
import type { Me } from '../../api/types';
import { ToastProvider } from '../../components/ToastProvider';
import ProjectPage from '../../pages/project/ProjectPage';
import { authApi } from '../auth/authApi';
import { SessionProvider } from '../auth/SessionProvider';
import { ProjectForm } from './ProjectForm';
import { projectsApi } from './projectsApi';
import { validateHttpsUrl, validateProjectTitle } from './validation';
import { demoMe } from '../../test/fixtures';

// Membre qui n'est ni porteur ni dans l'équipe de l'exemple (GET_projects_id.json).
const member: Me = demoMe({ username: 'amadou_diallo', technologies: ['react', 'typescript'] });

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

describe('validation des projets (PRJ)', () => {
  it('n’accepte que des liens https', () => {
    expect(validateHttpsUrl('http://exemple.dev')).toBe('projects.form.errors.url');
    expect(validateHttpsUrl('javascript:alert(1)')).toBe('projects.form.errors.url');
    expect(validateHttpsUrl('https://github.com/zetsu-demo/x')).toBeNull();
    expect(validateHttpsUrl('')).toBeNull();
  });

  it('exige un titre de 10 à 120 caractères', () => {
    expect(validateProjectTitle('Court')).toBe('projects.form.errors.title');
    expect(validateProjectTitle('Un titre de projet correct')).toBeNull();
  });
});

describe('ProjectPage (PRJ)', () => {
  const renderProject = () =>
    wrap(
      <Routes>
        <Route path="/projects/:id" element={<ProjectPage />} />
      </Routes>,
      '/projects/1',
    );

  it('affiche le détail : titre, rôles et équipe', async () => {
    renderProject();
    expect(
      await screen.findByRole('heading', {
        name: 'Annuaire open source des développeurs africains',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Développeur front-end React')).toBeTruthy();
    // Ibrahim figure à la fois comme titulaire d'un rôle et dans l'équipe.
    expect(screen.getAllByRole('link', { name: 'Ibrahim Sawadogo' }).length).toBeGreaterThan(0);
  });

  it('envoie une demande pour rejoindre avec un message assez long', async () => {
    vi.spyOn(authApi, 'me').mockResolvedValue(member);
    const join = vi.spyOn(projectsApi, 'join');
    renderProject();

    fireEvent.click(await screen.findByRole('button', { name: 'Rejoindre' }));
    fireEvent.change(await screen.findByLabelText(/^Rôle visé/), { target: { value: '1' } });
    const message = screen.getByLabelText(/^Message de présentation/);
    fireEvent.change(message, { target: { value: 'Trop court' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la demande' }));
    expect(await screen.findByText(/au moins 20 caractères/i)).toBeTruthy();
    expect(join).not.toHaveBeenCalled();

    const text = 'Je veux bien aider sur le front React, j’ai déjà fait des projets similaires.';
    fireEvent.change(message, { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la demande' }));
    await waitFor(() => expect(join).toHaveBeenCalledWith(1, { roleId: 1, message: text }));
  });
});

describe('ProjectForm (PRJ)', () => {
  it('refuse un lien non https, puis crée le projet', async () => {
    const create = vi.spyOn(projectsApi, 'create');
    const onSaved = vi.fn();
    wrap(<ProjectForm onSaved={onSaved} />);

    const type = (label: RegExp, value: string) =>
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    type(/^Titre du projet/, 'Plateforme d’entraide pour étudiants');
    type(/^Technologies/, 'react, node.js');
    type(
      /^Description/,
      'Une plateforme qui met en relation les étudiants pour s’entraider sur leurs projets et leurs révisions.',
    );
    type(/^Lien GitHub/, 'http://github.com/x');
    fireEvent.click(screen.getByRole('button', { name: 'Créer le projet' }));
    expect(await screen.findByText(/commencer par https/i)).toBeTruthy();
    expect(create).not.toHaveBeenCalled();

    type(/^Lien GitHub/, 'https://github.com/zetsu-demo/entraide');
    fireEvent.click(screen.getByRole('button', { name: 'Créer le projet' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plateforme d’entraide pour étudiants',
        type: 'STUDY',
        technologies: ['react', 'node.js'],
        githubUrl: 'https://github.com/zetsu-demo/entraide',
      }),
    );
  });
});
