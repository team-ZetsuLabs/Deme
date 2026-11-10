import type { PlaytestPlatform } from '../../api/types';

/**
 * Règles par plateforme (TST-7), reprises du contrat de Salif. Le serveur reste juge :
 * ce sont des contrôles côté front pour guider la saisie et éviter un aller-retour.
 */
export type PlatformConfig = {
  /** Identifiant d'application : format Android, Bundle iOS, ou aucun (web). */
  packageKind: 'android' | 'bundle' | null;
  /** Validation du lien d'inscription au test. */
  optInRe: RegExp;
  testersMin: number;
  testersMax: number;
  testersDefault: number;
  /** Durée du test par testeur, en jours. 0 en web (pas de décompte). */
  daysMin: number;
  daysMax: number;
  daysDefault: number;
  /** DAILY : décompte quotidien ; NONE : pas de décompte (web). */
  tracking: 'DAILY' | 'NONE';
};

const ID_RE = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/;

export const PLATFORMS: PlaytestPlatform[] = ['GOOGLE_PLAY', 'APP_STORE', 'WEB'];

export const PLATFORM_CONFIG: Record<PlaytestPlatform, PlatformConfig> = {
  GOOGLE_PLAY: {
    packageKind: 'android',
    optInRe: /^https:\/\/(play\.google\.com\/apps\/testing\/|groups\.google\.com\/)/,
    testersMin: 12,
    testersMax: 100,
    testersDefault: 14,
    daysMin: 14,
    daysMax: 60,
    daysDefault: 14,
    tracking: 'DAILY',
  },
  APP_STORE: {
    packageKind: 'bundle',
    optInRe: /^https:\/\/testflight\.apple\.com\/join\//,
    testersMin: 1,
    testersMax: 100,
    testersDefault: 10,
    daysMin: 1,
    daysMax: 60,
    daysDefault: 7,
    tracking: 'DAILY',
  },
  WEB: {
    packageKind: null,
    optInRe: /^https:\/\//,
    testersMin: 1,
    testersMax: 100,
    testersDefault: 10,
    daysMin: 0,
    daysMax: 0,
    daysDefault: 0,
    tracking: 'NONE',
  },
};

export const validatePackageId = (platform: PlaytestPlatform, value: string): boolean =>
  PLATFORM_CONFIG[platform].packageKind === null || ID_RE.test(value.trim());
