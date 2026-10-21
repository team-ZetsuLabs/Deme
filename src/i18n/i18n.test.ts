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
});
