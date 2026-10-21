import { createContext } from 'react';

export type UnreadContextValue = {
  /** Nombre de notifications non lues du membre connecté (0 pour un visiteur). */
  count: number;
  refresh: () => void;
  setCount: (update: (count: number) => number) => void;
};

export const UnreadContext = createContext<UnreadContextValue | null>(null);
