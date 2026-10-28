import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

afterEach(cleanup);

describe('Avatar', () => {
  it('affiche la photo quand une URL est fournie', () => {
    const { container } = render(<Avatar name="Aminata Diallo" photoUrl="/photo.webp" />);
    expect(container.querySelector('img')).toBeTruthy();
  });

  it('retombe sur les initiales si la photo ne charge pas', () => {
    const { container } = render(<Avatar name="Aminata Diallo" photoUrl="/cassee.webp" />);
    const img = container.querySelector('img');
    if (!img) throw new Error('image attendue');
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('AD')).toBeTruthy();
  });

  it('affiche les initiales sans photo', () => {
    render(<Avatar name="Ibrahim Traoré" photoUrl={null} />);
    expect(screen.getByText('IT')).toBeTruthy();
  });
});
