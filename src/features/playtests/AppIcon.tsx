import Avatar from '../../components/Avatar'
import styles from './AppIcon.module.css'

export type AppIconProps = { name: string; iconUrl?: string | null; size?: number }

/** Icône de l'application : l'image du serveur si elle vient du même site, sinon les initiales. */
export default function AppIcon({ name, iconUrl, size = 36 }: AppIconProps) {
  if (iconUrl && iconUrl.startsWith('/')) {
    return (
      <img className={styles.icon} src={iconUrl} alt="" width={size} height={size} loading="lazy" />
    )
  }
  return <Avatar name={name} size={size} square />
}
