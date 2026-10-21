import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import styles from './Tabs.module.css';

export type TabItem<K extends string> = { key: K; label: string };

export type TabsProps<K extends string> = {
  label: string;
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  children: ReactNode;
};

/** Onglets accessibles : flèches gauche et droite, Début et Fin, un seul panneau visible. */
export function Tabs<K extends string>({ label, tabs, active, onChange, children }: TabsProps<K>) {
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next =
      e.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : e.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    onChange(tabs[next].key);
    refs.current[next]?.focus();
  };

  return (
    <>
      <div className={styles.tabbar} role="tablist" aria-label={label}>
        {tabs.map((tab, i) => (
          <button
            key={tab.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab.key}`}
            aria-selected={tab.key === active}
            aria-controls={`${baseId}-panel`}
            tabIndex={tab.key === active ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className={styles.panel}
        tabIndex={0}
      >
        {children}
      </div>
    </>
  );
}
