import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Icon } from './Icon';
import styles from './Dialog.module.css';

export type DialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Fenêtre modale sur l'élément <dialog> natif : focus piégé, Échap pour fermer,
 * retour du focus sur le bouton d'origine, sans bibliothèque.
 */
export function Dialog({ open, title, onClose, children }: DialogProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // jsdom (tests) ne connaît pas showModal : on retombe sur l'attribut open.
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {open && (
        <>
          <div className={styles.head}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <Button variant="ghost" iconOnly aria-label={t('common.close')} onClick={onClose}>
              <Icon name="x" size={14} />
            </Button>
          </div>
          <div className={styles.body}>{children}</div>
        </>
      )}
    </dialog>
  );
}
