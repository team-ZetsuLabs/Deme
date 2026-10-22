import styles from './Avatar.module.css';
import { avatarColor, initials } from './avatarColor';

export type AvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: number;
  square?: boolean;
};

/** Photo du membre, ou ses initiales sur une couleur stable. Décoratif : le nom est affiché à côté. */
export function Avatar({ name, photoUrl, size = 26, square = false }: AvatarProps) {
  const className = square ? `${styles.avatar} ${styles.square}` : styles.avatar;
  const dimensions = { width: size, height: size };

  if (photoUrl) {
    return <img className={className} src={photoUrl} alt="" style={dimensions} loading="lazy" />;
  }
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        ...dimensions,
        fontSize: Math.max(10, Math.round(size * 0.38)),
        background: avatarColor(name),
      }}
    >
      {initials(name)}
    </span>
  );
}
