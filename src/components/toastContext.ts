import { createContext } from 'react';

export type ToastContextValue = {
  /** Affiche un message bref, lu par les lecteurs d'écran. */
  show: (message: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
