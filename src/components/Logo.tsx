import styles from './Logo.module.css'

export type LogoProps = {
  /** « horizontal » : D compact et nom ; « symbol » : D compact seul, pour les petits espaces. */
  variant?: 'horizontal' | 'symbol'
  height?: number
}

const D_PATH =
  'M12 28H72A100 100 0 0 1 170.54 111H123.25A54 54 0 0 0 72 74H58V111H12ZM12 147H58V182H72A54 54 0 0 0 122.55 147H170.18A100 100 0 0 1 72 228H12Z'

const NAME_PATH =
  'M153.04 248L153.04 12L119.04 12L119.04 98L83 98L8 173L83 248L153.04 248ZM277.54 132L228.08 132L216.08 144L228.08 156L265.54 156L265.54 190L228.08 190L216.08 202L228.08 214L283.54 214L283.54 248L214 248L168 202L197 173L168 144L214 98L277.54 98L277.54 132ZM305.54 134.96L305.54 248L339.54 248L339.54 149.04L356.58 132L376.5 132L393.54 149.04L393.54 248L427.54 248L427.54 149.04L444.58 132L464.5 132L481.54 149.04L481.54 248L515.54 248L515.54 134.96L478.58 98L430.5 98L410.54 117.96L390.58 98L342.5 98L305.54 134.96ZM640.04 132L590.58 132L578.58 144L590.58 156L628.04 156L628.04 190L590.58 190L578.58 202L590.58 214L646.04 214L646.04 248L576.5 248L530.5 202L559.5 173L530.5 144L576.5 98L640.04 98L640.04 132ZM119.04 132L97.08 132L56.08 173L97.08 214L119.04 214L119.04 132Z'

/**
 * Logo de Dɛmɛ (kit deme-logo-kit) : un D plein coupé en deux, et le nom dessiné en formes pleines.
 * Il prend la couleur du texte (encre en mode clair, clair en mode sombre), comme les deux
 * versions « clair » et « sombre » du kit.
 */
export default function Logo({ variant = 'horizontal', height = 28 }: LogoProps) {
  const symbol = variant === 'symbol'
  const viewBox = symbol ? '0 0 184 256' : '0 0 634 256'
  const width = Math.round((height * (symbol ? 184 : 634)) / 256)
  return (
    <svg
      className={styles.logo}
      viewBox={viewBox}
      width={width}
      height={height}
      role="img"
      aria-label="Dɛmɛ"
    >
      <path fill="currentColor" d={D_PATH} />
      {!symbol && (
        <g transform="translate(216 74.24) scale(0.62)">
          <path fill="currentColor" fillRule="evenodd" d={NAME_PATH} />
        </g>
      )}
    </svg>
  )
}
