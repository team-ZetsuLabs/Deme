/**
 * TYPES PROVISOIRES, en attendant le contrat publié par le back-end.
 *
 * Le CLAUDE.md interdit de recopier un type d'API à la main : ce fichier est
 * une exception temporaire, parce que le contrat du sprint 1 n'existe pas encore.
 * Dès que `npm run gen:api` produit ces types dans api-types.ts, on remplace
 * chaque import de ce fichier, puis on le supprime.
 */

export type Level = 'NEW' | 'MEMBER' | 'CONTRIBUTOR' | 'REFERENT';

/** GET /api/v1/me, et réponse de POST /auth/login et /auth/register. */
export type Me = {
  id: number;
  name: string;
  email: string;
  country: string | null; // code ISO 3166-1 alpha-2, ou "OTHER"
  city: string | null;
  photoUrl: string | null;
  reputation: number;
  level: Level;
  language: 'fr' | 'en';
  onboarded: boolean; // false tant que le parcours d'accueil (AUTH-5) n'est pas fait
};

/** POST /api/v1/auth/login */
export type LoginRequest = {
  email: string;
  password: string;
};

/** POST /api/v1/auth/register */
export type RegisterRequest = {
  name: string;
  email: string;
  country: string;
  password: string;
  /** Champ piège anti-robots : toujours vide pour un humain. */
  website: string;
};
