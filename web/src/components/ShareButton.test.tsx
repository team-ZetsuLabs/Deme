import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import i18n from '../i18n';
import { ToastProvider } from './ToastProvider';
import { ShareButton } from './ShareButton';

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(navigator, 'clipboard');
});

function renderShare() {
  render(
    <ToastProvider>
      <ShareButton title="Ma question" path="/questions/7" />
    </ToastProvider>,
  );
  return screen.getByRole('button', { name: /partager/i });
}

const expectedUrl = `${window.location.origin}/questions/7`;

describe('ShareButton', () => {
  it('utilise le partage natif du système quand il existe', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });

    fireEvent.click(renderShare());

    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({ title: 'Ma question', url: expectedUrl }),
    );
  });

  it('copie le lien et le signale quand le partage natif est absent', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    fireEvent.click(renderShare());

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expectedUrl));
    expect(await screen.findByText('Lien copié')).toBeTruthy();
  });
});
