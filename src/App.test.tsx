import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import './i18n';
import { App } from './App';

afterEach(cleanup);

describe('App', () => {
  it('affiche la mise en page et le fil des questions', async () => {
    render(<App />);
    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0);
    expect(await screen.findByRole('heading', { level: 1 })).toBeTruthy();
  });
});
