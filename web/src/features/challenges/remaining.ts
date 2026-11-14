export type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
};

/** Temps restant jusqu'à la fin enregistrée du défi (cahier, point 9 de la revue des maquettes). */
export function remainingUntil(endsAt: string, now: number): Remaining {
  const totalSeconds = Math.max(0, Math.floor((new Date(endsAt).getTime() - now) / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    ended: totalSeconds === 0,
  };
}
