import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CountrySelect } from '../../components/CountrySelect';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { useToast } from '../../components/useToast';
import { errorMessage } from '../../api/errorMessage';
import { useSession } from '../../features/auth/useSession';
import { SkillPicker } from '../../features/profile/SkillPicker';
import { usePageTitle } from '../../hooks/usePageTitle';
import { changeLanguage, LANGUAGES, type Language } from '../../i18n';
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
  const { status, user, updateMe } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const returnTo = useReturnTo();
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [country, setCountry] = useState(user?.countryCode ?? '');
  const [busy, setBusy] = useState<'save' | 'later' | null>(null);
  const language = (i18n.resolvedLanguage ?? 'fr') as Language;
  usePageTitle(t('welcome.pageTitle'));

  if (status === 'loading') return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboarded !== false) return <Navigate to={returnTo} replace />;

  const save = async (mode: 'save' | 'later') => {
    setBusy(mode);
    try {
      await updateMe(
        mode === 'save'
          ? { skills, countryCode: country || undefined, language, onboarded: true }
          : { language, onboarded: true },
      );
      navigate(returnTo, { replace: true });
    } catch (error) {
      toast(errorMessage(t, error));
      setBusy(null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void save('save');
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
            >
              <CountrySelect
                id="welcome-country"
                value={country}
                onChange={setCountry}
                emptyLabel={t('auth.fields.countryPlaceholder')}
                otherLabel={t('auth.fields.countryOther')}
                describedBy="welcome-country-hint"
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
            <Button
              variant="ghost"
              busy={busy === 'later'}
              disabled={!!busy}
              onClick={() => save('later')}
            >
              {t('welcome.later')}
            </Button>
            <Button type="submit" variant="primary" busy={busy === 'save'} disabled={!!busy}>
              {busy === 'save' ? t('welcome.busy') : t('welcome.submit')}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
