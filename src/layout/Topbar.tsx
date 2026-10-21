import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../components/buttonClass';
import { Icon } from '../components/Icon';
import { useSession } from '../features/auth/useSession';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import styles from './Topbar.module.css';

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

export function Topbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status, user } = useSession();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  // Raccourci « / » pour aller à la recherche (QA-7).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || isTyping(e.target) || document.querySelector('dialog[open]')) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/questions?q=${encodeURIComponent(q)}` : '/questions');
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.inner}>
        <Logo />
        <form className={styles.search} role="search" onSubmit={onSubmit}>
          <Icon name="search" className={styles.searchIcon} />
          <label htmlFor="global-search" className="sr-only">
            {t('topbar.search')}
          </label>
          <input
            id="global-search"
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('topbar.searchPlaceholder')}
          />
          <kbd className={styles.kbd} aria-hidden="true">
            /
          </kbd>
        </form>
        <div className={styles.right}>
          <LanguageSwitcher />
          <ThemeToggle />
          {user && <UserMenu user={user} />}
          {status === 'anonymous' && (
            <>
              {/* Sur mobile, l'onglet « Compte » de la barre du bas mène à la connexion. */}
              <Link
                to="/login"
                className={`${buttonClass({ variant: 'ghost' })} ${styles.authLink}`}
              >
                {t('topbar.login')}
              </Link>
              <Link
                to="/register"
                className={`${buttonClass({ variant: 'primary' })} ${styles.authLink}`}
              >
                {t('topbar.register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
