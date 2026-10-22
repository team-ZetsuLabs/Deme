import { useSyncExternalStore } from 'react';

/**
 * Mode maintenance : le back-end répond 503 avec le code MAINTENANCE.
 * api.ts le signale ici, et l'application affiche la page de maintenance à la place des écrans.
 */
let active = false;
const listeners = new Set<() => void>();

export function reportMaintenance() {
  if (active) return;
  active = true;
  listeners.forEach((listener) => listener());
}

/** Pour les tests uniquement. */
export function resetMaintenance() {
  active = false;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMaintenance(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => active,
    () => false,
  );
}
