export type Remaining = { days: number; hours: number; minutes: number; ended: boolean };

/** Temps restant jusqu'à la fin enregistrée du défi (cahier, point 9 de la revue des maquettes). */
export function remainingUntil(endsAt: string, now: number): Remaining {
  const totalMinutes = Math.max(0, Math.floor((new Date(endsAt).getTime() - now) / 60000));
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
    ended: totalMinutes === 0,
  };
}
