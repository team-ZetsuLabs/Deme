export type IconName =
  | 'github'
  | 'google'
  | 'help'
  | 'jobs'
  | 'mission'
  | 'trophy'
  | 'user'
  | 'bell'
  | 'gear'
  | 'out'
  | 'search'
  | 'up'
  | 'check'
  | 'x'
  | 'pin'
  | 'cal'
  | 'sun'
  | 'moon'
  | 'star'
  | 'offline'
  | 'flag'
  | 'clock'
  | 'users'
  | 'share'
  | 'install'
  | 'projects';

export type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
};

/** Icône décorative : le libellé accessible est porté par le bouton ou le lien parent. */
export function Icon({ name, size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <use href={`#i-${name}`} />
    </svg>
  );
}
