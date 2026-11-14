import type { Me } from '../../api/types';

/** Publier une offre est réservé au rôle Recruteur, attribué par l'équipe (JOB-4). */
export function isRecruiter(user: Me | null): boolean {
  return user?.role === 'RECRUITER' || user?.role === 'ADMIN';
}
