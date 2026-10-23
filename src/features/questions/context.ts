import type { MobileMoneyOperator, NetworkQuality } from '../../api/types';

/** Valeurs proposées pour le contexte africain (QA-2). Les libellés sont dans i18n : context.*. */
export const OPERATORS: MobileMoneyOperator[] = [
  'ORANGE_MONEY',
  'WAVE',
  'MOOV_MONEY',
  'MTN_MOMO',
  'MPESA',
  'OTHER',
];

export const NETWORKS: NetworkQuality[] = ['GOOD', 'UNSTABLE', 'VERY_POOR'];
