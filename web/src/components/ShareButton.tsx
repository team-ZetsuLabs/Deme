import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Icon } from './Icon';
import { useToast } from './useToast';

export type ShareButtonProps = {
  /** Titre du contenu partagé (question, offre, mission). */
  title: string;
  /** Chemin à partager (ex. « /questions/12 »). Défaut : l'adresse courante. */
  path?: string;
  size?: 'md' | 'sm';
};

/**
 * Partage un lien : via le menu natif du système (Web Share API) quand il existe — pratique sur
 * mobile — sinon copie le lien dans le presse-papiers. Tout reste côté client.
 */
export function ShareButton({ title, path, size = 'sm' }: ShareButtonProps) {
  const { t } = useTranslation();
  const toast = useToast();

  const onShare = async () => {
    const url = path ? `${window.location.origin}${path}` : window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // L'utilisateur a fermé le menu de partage : rien à signaler.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast(t('share.copied'));
    } catch {
      toast(t('share.failed'));
    }
  };

  return (
    <Button variant="ghost" size={size} onClick={onShare}>
      <Icon name="share" />
      {t('share.button')}
    </Button>
  );
}
