import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from '../i18n';
import { CountrySelect } from './CountrySelect';

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

afterEach(cleanup);

const renderSelect = (value = '', onChange = vi.fn()) => {
  render(
    <>
      <label htmlFor="pays">Pays</label>
      <CountrySelect
        id="pays"
        value={value}
        onChange={onChange}
        emptyLabel="Choisissez votre pays"
        otherLabel="Autre pays"
      />
    </>,
  );
  return { onChange, box: screen.getByRole('combobox', { name: 'Pays' }) };
};

describe('CountrySelect', () => {
  it('affiche le pays choisi avec son drapeau', () => {
    const { box } = renderSelect('SN');
    expect(box.textContent).toBe('Sénégal');
    expect(box.querySelector('img')?.getAttribute('src')).toBe('/flags/SN.svg');
  });

  it('ouvre la liste au clic, avec un drapeau par pays, et choisit au clic', () => {
    const { box, onChange } = renderSelect();
    expect(box.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(box);
    expect(box.getAttribute('aria-expanded')).toBe('true');
    const options = screen.getAllByRole('option');
    // Valeur vide, 54 pays, « Autre ».
    expect(options).toHaveLength(56);
    expect(screen.getByRole('option', { name: 'Kenya' }).querySelector('img')).toBeTruthy();
    fireEvent.click(screen.getByRole('option', { name: 'Kenya' }));
    expect(onChange).toHaveBeenCalledWith('KE');
    expect(box.getAttribute('aria-expanded')).toBe('false');
  });

  it('se pilote au clavier : flèches, premières lettres sans accents, Entrée, Échap', () => {
    const { box, onChange } = renderSelect();
    fireEvent.keyDown(box, { key: 'ArrowDown' });
    expect(box.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(box, { key: 'c' });
    fireEvent.keyDown(box, { key: 'o' });
    fireEvent.keyDown(box, { key: 't' });
    const active = document.getElementById(box.getAttribute('aria-activedescendant') as string);
    // L'apostrophe dépend du navigateur (Intl.DisplayNames).
    expect(active?.textContent).toMatch(/^Côte d.Ivoire$/);
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('CI');

    fireEvent.keyDown(box, { key: 'ArrowDown' });
    fireEvent.keyDown(box, { key: 'Escape' });
    expect(box.getAttribute('aria-expanded')).toBe('false');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
