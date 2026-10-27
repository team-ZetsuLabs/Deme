import { AFRICAN_COUNTRIES } from '../i18n/countries';
import styles from './Flag.module.css';

export type FlagProps = {
  /** Code ISO à deux lettres. Rien ne s'affiche pour « Autre » ou un pays hors liste. */
  code: string | null | undefined;
  /** Largeur en pixels ; la hauteur suit le format 3:2. */
  width?: number;
  /** Nom du pays quand il n'est pas écrit à côté ; sinon le drapeau est décoratif. */
  label?: string | null;
};

/**
 * Drapeau d'un pays africain, en SVG servi par le site (public/flags). Les drapeaux emoji ne
 * s'affichent pas sous Windows, où le navigateur montre deux lettres à la place.
 */
export function Flag({ code, width = 18, label }: FlagProps) {
  if (!code || !(AFRICAN_COUNTRIES as readonly string[]).includes(code)) return null;
  return (
    <img
      className={styles.flag}
      src={`/flags/${code}.svg`}
      alt={label ?? ''}
      title={label ?? undefined}
      width={width}
      height={Math.round((width * 2) / 3)}
      loading="lazy"
      decoding="async"
    />
  );
}
