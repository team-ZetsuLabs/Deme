import type { ReactNode } from 'react';
import { useMaintenance } from '../api/maintenance';
import { MaintenanceScreen } from './MaintenanceScreen';

export type MaintenanceGateProps = { children: ReactNode };

/** Affiche l'écran de maintenance dès qu'un appel à l'API l'a signalée. */
export function MaintenanceGate({ children }: MaintenanceGateProps) {
  return useMaintenance() ? <MaintenanceScreen /> : <>{children}</>;
}
