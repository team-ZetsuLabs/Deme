import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext, type ThemePref } from './themeContext';

const STORAGE_KEY = 'zetsu-theme';
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function readPref(): ThemePref {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'dark' || value === 'system') return value;
  } catch {
    // stockage indisponible : clair par défaut
  }
  return 'light';
}

function resolve(pref: ThemePref): 'light' | 'dark' {
  return pref === 'dark' || (pref === 'system' && darkQuery().matches) ? 'dark' : 'light';
}

type ThemeProviderProps = { children: ReactNode };

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [pref, setPrefState] = useState<ThemePref>(readPref);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolve(readPref()));

  useEffect(() => {
    const apply = () => {
      const next = resolve(pref);
      setResolved(next);
      document.documentElement.dataset.theme = next;
      document.documentElement.dataset.pref = pref;
    };
    apply();
    if (pref !== 'system') return;
    const query = darkQuery();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [pref]);

  const setPref = useCallback((next: ThemePref) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // le choix reste valable pour la session
    }
    setPrefState(next);
  }, []);

  const value = useMemo(() => ({ pref, resolved, setPref }), [pref, resolved, setPref]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
