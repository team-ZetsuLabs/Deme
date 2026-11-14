import styles from './Skeleton.module.css';

export type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  radius?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
};

/** Bloc gris avec un reflet qui passe, à la place d'un contenu en cours de chargement. */
export function Skeleton({ width = '100%', height = 12, radius = 'sm', className }: SkeletonProps) {
  return (
    <span
      className={[styles.sk, styles[radius], className].filter(Boolean).join(' ')}
      style={{ width, height }}
    />
  );
}
