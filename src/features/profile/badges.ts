/** Badges de REP-4 (P1). Les libellés sont dans i18n : badges.<id>.name et .desc. */
export const BADGES = [
  { id: 'FIRST_STEP', short: '1', tone: 'green' },
  { id: 'HELPER', short: '10', tone: 'gold' },
  { id: 'SOLVER', short: '5', tone: 'gold' },
  { id: 'CHALLENGER', short: 'D', tone: 'green' },
  { id: 'POLYGLOT', short: '5T', tone: 'gold' },
  { id: 'LOCAL_HELP', short: 'L', tone: 'green' },
] as const;

export type BadgeTone = (typeof BADGES)[number]['tone'];
