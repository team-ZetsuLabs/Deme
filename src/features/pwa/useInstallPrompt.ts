import { useEffect, useState } from 'react';

/** Événement non standard émis par Chrome/Edge quand l'application peut être installée. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/**
 * Capture l'invitation d'installation du navigateur pour la proposer au bon moment (CLAUDE.md :
 * application installable, légère en 3G). Sur les navigateurs sans cette API, rien ne s'affiche.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      // On empêche l'invitation automatique du navigateur pour la déclencher via notre bouton.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    // L'événement ne sert qu'une fois : on retire le bouton après le choix.
    setDeferred(null);
  };

  return { canInstall: deferred !== null, install };
}
