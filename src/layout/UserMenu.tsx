import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Me } from '../api/provisional-types';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { useSession } from '../features/auth/useSession';
import styles from './UserMenu.module.css';

export type UserMenuProps = { user: Me };

/** Pastille du membre connecté, avec son menu. */
export function UserMenu({ user }: UserMenuProps) {
  const { t, i18n } = useTranslation();
  const { logout } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const points = user.reputation.toLocaleString(i18n.language);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const onLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/questions');
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.chip}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t('topbar.account')}
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar name={user.name} photoUrl={user.photoUrl} size={30} />
        <span className={styles.name}>{user.name.split(' ')[0]}</span>
        <span className={styles.points} aria-hidden="true">
          {points}
        </span>
      </button>
      <div id={menuId} className={styles.menu} hidden={!open}>
        <div className={styles.head}>
          <b>{user.name}</b>
          <span>{t('topbar.points', { points })}</span>
        </div>
        <button type="button" className={styles.item} onClick={onLogout}>
          <Icon name="out" />
          {t('topbar.logout')}
        </button>
      </div>
    </div>
  );
}
