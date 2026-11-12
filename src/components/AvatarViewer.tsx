import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from './Avatar';
import { Dialog } from './Dialog';
import styles from './AvatarViewer.module.css';

export type AvatarViewerProps = {
  name: string;
  photoUrl: string | null;
  size: number;
};

/** Avatar cliquable : ouvre la photo de profil en grand. Sans photo, c'est un simple Avatar. */
export function AvatarViewer({ name, photoUrl, size }: AvatarViewerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (!photoUrl) return <Avatar name={name} photoUrl={null} size={size} />;

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-label={t('common.viewPhoto', { name })}
      >
        <Avatar name={name} photoUrl={photoUrl} size={size} />
      </button>
      <Dialog open={open} title={name} onClose={() => setOpen(false)}>
        <img src={photoUrl} alt={t('common.viewPhoto', { name })} className={styles.full} />
      </Dialog>
    </>
  );
}
