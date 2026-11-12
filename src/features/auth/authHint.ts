const KEY = 'deme.auth';

/**
 * Mémorise si le dernier état connu de la session était « connecté ». Sert à éviter le
 * clignotement de la page d'accueil publique avant la redirection vers /feed : à la
 * reconnexion, on attend /auth/me au lieu d'afficher la page d'inscription une fraction
 * de seconde. Pure optimisation d'affichage ; le serveur reste seul juge des droits.
 */
export function setAuthHint(authenticated: boolean) {
  try {
    if (authenticated) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    // Navigation privée ou stockage bloqué : on ignore, le rendu reste correct.
  }
}

export function hasAuthHint(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
