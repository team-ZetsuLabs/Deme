import type { IconName } from '../components/Icon';

export type NavItem = {
  to: string;
  labelKey: string;
  /** Libellé court pour la barre d'onglets mobile, si le libellé normal est trop long. */
  shortLabelKey?: string;
  icon: IconName;
  /** Autres chemins qui rendent l'espace actif (Mes candidatures relève d'Emploi). */
  alsoActive?: string[];
  /** Mis en avant dans la barre d'onglets mobile ; les autres passent sous « Plus ». */
  primary?: boolean;
};

/** Espaces principaux, partagés par le menu latéral et la barre d'onglets mobile. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/feed', labelKey: 'nav.feed', icon: 'home', primary: true },
  { to: '/questions', labelKey: 'nav.questions', icon: 'help', primary: true },
  { to: '/jobs', labelKey: 'nav.jobs', icon: 'jobs', alsoActive: ['/applications'], primary: true },
  { to: '/missions', labelKey: 'nav.missions', icon: 'mission' },
  {
    to: '/playtests',
    labelKey: 'nav.playtests',
    shortLabelKey: 'nav.playtestsShort',
    icon: 'install',
  },
  { to: '/challenges', labelKey: 'nav.challenges', icon: 'trophy' },
  { to: '/projects', labelKey: 'nav.projects', icon: 'projects' },
  {
    to: '/communities',
    labelKey: 'nav.communities',
    shortLabelKey: 'nav.communitiesShort',
    icon: 'users',
  },
];

/** Barre d'onglets mobile : espaces mis en avant, et les autres regroupés sous « Plus ». */
export const PRIMARY_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter((item) => item.primary);
export const MORE_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter((item) => !item.primary);

/** Onglet « Compte » de la barre mobile : connexion, ou profil une fois connecté. */
export const ACCOUNT_ITEM: NavItem = { to: '/login', labelKey: 'nav.account', icon: 'user' };
export const ACCOUNT_ITEM_SIGNED_IN: NavItem = {
  to: '/users/me',
  labelKey: 'nav.account',
  icon: 'user',
};

/**
 * Liens du menu du membre (barre du haut). Les notifications n'y sont pas : la cloche est
 * juste à côté. Le menu latéral ne garde que les espaces.
 */
export const USER_MENU_LINKS: NavItem[] = [
  { to: '/users/me', labelKey: 'nav.profile', icon: 'user' },
  { to: '/applications', labelKey: 'nav.applications', icon: 'jobs' },
  { to: '/settings', labelKey: 'nav.settings', icon: 'gear' },
];

/** L'espace est actif sur son chemin ou sur l'un de ses chemins associés. */
export function isSpaceActive(item: NavItem, pathname: string): boolean {
  return [item.to, ...(item.alsoActive ?? [])].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
