import styles from './Logo.module.css'

export default function Logo() {
  return (
    <span className={styles.logo}>
      <svg className={styles.mark} width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <rect x="0.5" y="0.5" width="21" height="21" rx="5" className={styles.frame} />
        <rect x="1" y="1" width="5" height="20" className={styles.green} />
        <rect x="7" y="1" width="2" height="20" className={styles.gap} />
        <rect x="9" y="1" width="2" height="20" className={styles.gold} />
        <rect x="11" y="1" width="2" height="20" className={styles.gap} />
        <rect x="13" y="1" width="5" height="20" className={styles.green} />
        <rect x="18" y="1" width="3" height="20" className={styles.gap} />
      </svg>
      zetsu
    </span>
  )
}
