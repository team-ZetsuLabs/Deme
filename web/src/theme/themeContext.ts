import { createContext } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';

export type ThemeContextValue = {
  pref: ThemePref;
  resolved: 'light' | 'dark';
  setPref: (pref: ThemePref) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
