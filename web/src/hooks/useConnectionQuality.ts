import { useSyncExternalStore } from 'react';

export type ConnectionQuality = 'offline' | 'slow' | 'good';

/** API Network Information : Chrome Android (la majorité du public), absente ailleurs. */
type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
};

function connection(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

const SLOW_TYPES = ['slow-2g', '2g', '3g'];

export function readConnectionQuality(): ConnectionQuality {
  if (!navigator.onLine) return 'offline';
  const info = connection();
  if (info && (info.saveData || SLOW_TYPES.includes(info.effectiveType ?? ''))) return 'slow';
  return 'good';
}

function subscribe(callback: () => void) {
  const info = connection();
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  info?.addEventListener?.('change', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
    info?.removeEventListener?.('change', callback);
  };
}

/** État de la connexion, mis à jour en direct : hors ligne, lente (2G, 3G, économie de données) ou bonne. */
export function useConnectionQuality(): ConnectionQuality {
  return useSyncExternalStore(subscribe, readConnectionQuality, () => 'good');
}
