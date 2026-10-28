import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CountrySelect } from '../../components/CountrySelect';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { useToast } from '../../components/useToast';
import { api } from '../../api/api';
import { errorMessage } from '../../api/errorMessage';
import { authApi } from '../../features/auth/authApi';
import { useSession } from '../../features/auth/useSession';
import { SkillPicker } from '../../features/profile/SkillPicker';
import { usePageTitle } from '../../hooks/usePageTitle';
import { changeLanguage, isSavedLanguage, LANGUAGES, type Language } from '../../i18n';
import { OTHER_COUNTRY } from '../../i18n/countries';
import { Logo } from '../../layout/Logo';
import { PageLoader } from '../../layout/PageLoader';
import styles from './WelcomePage.module.css';

function useReturnTo(): string {
  const from = (useLocation().state as { from?: unknown } | null)?.from;
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
    ? from
    : '/questions';
}

/** Parcours d'accueil après inscription (AUTH-5) : stack, pays, langue. */
export default function WelcomePage() {
  const { t, i18n } = useTranslation();
  const { status, user, setUser, onboardingSkipped, skipOnboarding } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const returnTo = useReturnTo();
  const [skills, setSkills] = useState<string[]>(user?.technologies ?? []);
  const [country, setCountry] = useState(user?.countryCode ?? '');
  const [countryError, setCountryError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const language = (i18n.resolvedLanguage ?? 'fr') as Language;
  usePageTitle(t('welcome.pageTitle'));

  if (status === 'loading') return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboardingCompleted || onboardingSkipped) return <Navigate to={returnTo} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Le contrat exige un pays : « Autre » n'est pas un code accepté.
    if (!country || country === OTHER_COUNTRY) {
      setCountryError(t('welcome.country.required'));
      document.getElementById('welcome-country')?.focus();
      return;
    }
    setBusy(true);
    // Le contrat n'enregistre pour l'instant que fr/en ; le portugais vit dans le localStorage,
    // l'interface reste donc en portugais même si le compte retient le français.
    const savedLanguage = isSavedLanguage(language) ? language : 'fr';
    try {
      const me = await authApi.completeOnboarding({
        technologies: skills,
        countryCode: country,
        language: savedLanguage,
      });
      // En mode mock, la réponse est un fichier fixe : on garde les choix du membre.
      setUser(
        api.mode === 'mock'
          ? {
              ...user,
              technologies: skills,
              countryCode: country,
              language: savedLanguage,
              onboardingCompleted: true,
            }
          : me,
      );
      navigate(returnTo, { replace: true });
    } catch (error) {
      toast(errorMessage(t, error));
      setBusy(false);
    }
  };

  // Le parcours demande pays et langue : « Plus tard » ne l'enregistre pas, on le repropose à la prochaine visite.
  const later = () => {
    skipOnboarding();
    navigate(returnTo, { replace: true });
  };

  return (
    <div className={`${styles.page} page-enter`}>
      <header className={styles.top}>
        <Logo />
      </header>
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>
          {t('welcome.title', { name: user.displayName.split(' ')[0] })}
        </h1>
        <p className={styles.lead}>{t('welcome.lead')}</p>

        <form onSubmit={onSubmit} noValidate>
          <fieldset className={styles.section}>
            <legend className={styles.legend}>
              <span className={styles.step} aria-hidden="true">
                1
              </span>
              {t('welcome.stack.legend')}
            </legend>
            <p className={styles.hint}>{t('welcome.stack.hint')}</p>
            <SkillPicker value={skills} onChange={setSkills} />
          </fieldset>

          <fieldset className={styles.section}>
            <legend className={styles.legend}>
              <span className={styles.step} aria-hidden="true">
                2
              </span>
              {t('welcome.country.legend')}
            </legend>
            <Field
              id="welcome-country"
              label={t('auth.fields.country')}
              hint={t('welcome.country.hint')}
              error={countryError}
            >
              <CountrySelect
                id="welcome-country"
                value={country}
                onChange={(value) => {
                  setCountry(value);
                  setCountryError(null);
                }}
                emptyLabel={t('auth.fields.countryPlaceholder')}
                invalid={!!countryError}
                describedBy={countryError ? 'welcome-country-error' : 'welcome-country-hint'}
              />
            </Field>
          </fieldset>

          <fieldset className={styles.section}>
            <legend className={styles.legend}>
              <span className={styles.step} aria-hidden="true">
                3
              </span>
              {t('welcome.language.legend')}
            </legend>
            <p className={styles.hint}>{t('welcome.language.hint')}</p>
            <div className={styles.languages}>
              {LANGUAGES.map((lang) => (
                <label key={lang} className={styles.language} lang={lang}>
                  <input
                    type="radio"
                    name="welcome-language"
                    value={lang}
                    checked={language === lang}
                    onChange={() => changeLanguage(lang)}
                  />
                  {t(`language.${lang}`)}
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.actions}>
            <Button variant="ghost" disabled={busy} onClick={later}>
              {t('welcome.later')}
            </Button>
            <Button type="submit" variant="primary" busy={busy} disabled={busy}>
              {busy ? t('welcome.busy') : t('welcome.submit')}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
