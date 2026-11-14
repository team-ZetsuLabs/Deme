import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuestionImage } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { photoError, PHOTO_TYPES } from '../profile/photo';
import { questionsApi } from './questionsApi';
import styles from './QuestionImagePicker.module.css';

/** Nombre maximum de photos par question. */
export const QUESTION_IMAGES_MAX = 2;

export type QuestionImagePickerProps = {
  images: QuestionImage[];
  onChange: (images: QuestionImage[]) => void;
};

/** Joindre jusqu'à 2 photos à une question (captures d'écran). Contrat provisoire (mode mock). */
export function QuestionImagePicker({ images, onChange }: QuestionImagePickerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const full = images.length >= QUESTION_IMAGES_MAX;

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = photoError(file);
    if (problem) {
      setError(t(problem));
      return;
    }
    setBusy(true);
    try {
      const image = await questionsApi.uploadImage(file);
      onChange([...images, image]);
      setError(null);
    } catch (err) {
      setError(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>
        {t('ask.fields.photos')} <span className="muted">{t('ask.optional')}</span>
      </span>
      <p className={styles.hint}>{t('ask.fields.photosHint')}</p>

      {images.length > 0 && (
        <ul className={styles.thumbs}>
          {images.map((img) => (
            <li key={img.id} className={styles.thumb}>
              <img src={img.url} alt="" />
              <button
                type="button"
                className={styles.remove}
                aria-label={t('ask.fields.removePhoto')}
                onClick={() => onChange(images.filter((i) => i.id !== img.id))}
              >
                <Icon name="x" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <Button size="sm" busy={busy} onClick={() => inputRef.current?.click()}>
          {t('ask.fields.addPhoto')}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-label={t('ask.fields.addPhoto')}
        onChange={onFile}
      />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
