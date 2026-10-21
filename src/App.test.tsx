import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import './i18n';
import { App } from './App';

afterEach(cleanup);

describe('App', () => {
  it("affiche la page d'accueil", async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1 }, { timeout: 4000 })).toBeTruthy();
    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0);
  });
});
