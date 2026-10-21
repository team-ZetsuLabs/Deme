import type { IconName } from '../components/Icon';

export type NavItem = {
  to: string;
  labelKey: string;
  icon: IconName;
};

/** Espaces principaux, partagés par le menu latéral et la barre d'onglets mobile. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/questions', labelKey: 'nav.questions', icon: 'help' },
  { to: '/jobs', labelKey: 'nav.jobs', icon: 'jobs' },
  { to: '/missions', labelKey: 'nav.missions', icon: 'mission' },
  { to: '/challenges', labelKey: 'nav.challenges', icon: 'trophy' },
];

export const ACCOUNT_ITEM: NavItem = { to: '/login', labelKey: 'nav.account', icon: 'user' };
