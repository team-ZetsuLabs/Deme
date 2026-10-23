import type { IconName } from '../components/Icon';

export type NavItem = {
  to: string;
  labelKey: string;
  /** Libellé court pour la barre d'onglets mobile, si le libellé normal est trop long. */
  shortLabelKey?: string;
  icon: IconName;
};

/** Espaces principaux, partagés par le menu latéral et la barre d'onglets mobile. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/questions', labelKey: 'nav.questions', icon: 'help' },
  { to: '/jobs', labelKey: 'nav.jobs', icon: 'jobs' },
  { to: '/missions', labelKey: 'nav.missions', icon: 'mission' },
  { to: '/challenges', labelKey: 'nav.challenges', icon: 'trophy' },
  {
    to: '/communities',
    labelKey: 'nav.communities',
    shortLabelKey: 'nav.communitiesShort',
    icon: 'users',
  },
];

/** Onglet « Compte » de la barre mobile : connexion, ou profil une fois connecté. */
export const ACCOUNT_ITEM: NavItem = { to: '/login', labelKey: 'nav.account', icon: 'user' };
export const ACCOUNT_ITEM_SIGNED_IN: NavItem = {
  to: '/users/me',
  labelKey: 'nav.account',
  icon: 'user',
};

/** Liens du compte, dans le menu latéral et le menu du membre. */
export const ACCOUNT_LINKS: NavItem[] = [
  { to: '/users/me', labelKey: 'nav.profile', icon: 'user' },
  { to: '/notifications', labelKey: 'nav.notifications', icon: 'bell' },
  { to: '/applications', labelKey: 'nav.applications', icon: 'jobs' },
  { to: '/settings', labelKey: 'nav.settings', icon: 'gear' },
];
