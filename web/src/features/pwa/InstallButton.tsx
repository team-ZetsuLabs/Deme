import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { useInstallPrompt } from './useInstallPrompt';
import styles from './InstallButton.module.css';

/** Bouton « Installer l'application », affiché seulement quand le navigateur le permet. */
export function InstallButton() {
  const { t } = useTranslation();
  const { canInstall, install } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className={styles.install}
      aria-label={t('install.button')}
      onClick={() => void install()}
    >
      <Icon name="install" />
      {/* Le libellé laisse la place à l'icône seule sur petit écran ; le nom accessible reste porté par aria-label. */}
      <span className={styles.label}>{t('install.button')}</span>
    </Button>
  );
}
