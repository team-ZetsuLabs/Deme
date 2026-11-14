import { afterAll, describe, expect, it } from 'vitest';
import i18n, { changeLanguage } from './index';

afterAll(async () => {
  await i18n.changeLanguage('fr');
});

describe('chargement des langues', () => {
  it("ne charge l'anglais qu'à la demande", async () => {
    expect(i18n.hasResourceBundle('fr', 'translation')).toBe(true);
    expect(i18n.hasResourceBundle('en', 'translation')).toBe(false);

    await changeLanguage('en');
    expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
    expect(i18n.t('topbar.login')).toBe('Log in');
    expect(document.documentElement.lang).toBe('en');
  });

  it('charge le portugais à la demande', async () => {
    await changeLanguage('pt');
    expect(i18n.hasResourceBundle('pt', 'translation')).toBe(true);
    expect(i18n.t('topbar.login')).toBe('Entrar');
    expect(document.documentElement.lang).toBe('pt');
  });

  it("charge l'arabe et passe l'interface en droite-à-gauche", async () => {
    await changeLanguage('ar');
    expect(i18n.hasResourceBundle('ar', 'translation')).toBe(true);
    expect(i18n.t('topbar.login')).toBe('تسجيل الدخول');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');

    // Le retour à une langue LTR rétablit le sens d'écriture.
    await changeLanguage('fr');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
