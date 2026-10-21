import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Me } from '../../api/provisional-types';
import { errorMessage } from '../../api/errorMessage';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { useToast } from '../../components/useToast';
import { authApi } from '../auth/authApi';
import { useSession } from '../auth/useSession';
import { photoError, PHOTO_TYPES } from './photo';
import styles from './PhotoField.module.css';

export type PhotoFieldProps = { user: Me };

/** Photo de profil (SET-1), envoyée dès qu'elle est choisie. */
export function PhotoField({ user }: PhotoFieldProps) {
  const { t } = useTranslation();
  const { setUser } = useSession();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = photoError(file);
    setError(problem ? t(problem) : null);
    if (problem) return;
    setBusy(true);
    try {
      setUser(await authApi.uploadPhoto(file));
      toast(t('settings.photo.updated'));
    } catch (err) {
      setError(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    setBusy(true);
    try {
      setUser(await authApi.deletePhoto());
      toast(t('settings.photo.removed'));
    } catch (err) {
      setError(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.row}>
      <Avatar name={user.name} photoUrl={user.photoUrl} size={72} />
      <div>
        <div className={styles.actions}>
          <Button size="sm" busy={busy} onClick={() => inputRef.current?.click()}>
            {t('settings.photo.change')}
          </Button>
          {user.photoUrl && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={onRemove}>
              {t('settings.photo.remove')}
            </Button>
          )}
          <input
            ref={inputRef}
            id="settings-photo"
            type="file"
            accept={PHOTO_TYPES.join(',')}
            className="sr-only"
            tabIndex={-1}
            aria-label={t('settings.photo.change')}
            onChange={onFile}
          />
        </div>
        <p className={styles.hint}>{t('settings.photo.hint')}</p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
