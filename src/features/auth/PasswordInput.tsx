import { useState, type ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './PasswordInput.module.css';

export type PasswordInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & {
  id: string;
};

/** Champ mot de passe avec bouton Afficher / Masquer. */
export function PasswordInput({ id, ...rest }: PasswordInputProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.wrap}>
      <input {...rest} id={id} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className={styles.reveal}
        aria-pressed={visible}
        aria-controls={id}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? t('auth.fields.hide') : t('auth.fields.show')}
      </button>
    </div>
  );
}
