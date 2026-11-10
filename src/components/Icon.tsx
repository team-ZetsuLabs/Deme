export type IconName =
  | 'home'
  | 'flag'
  | 'doc'
  | 'tag'
  | 'users'
  | 'jobs'
  | 'trophy'
  | 'list'
  | 'gear'
  | 'out'
  | 'search'
  | 'check'
  | 'x'
  | 'up'
  | 'menu'
  | 'sun'
  | 'moon'
  | 'ext'
  | 'dl'
  | 'plus'
  | 'shield'
  | 'globe'
  | 'eye'
  | 'eyeOff'

export type IconProps = { name: IconName; size?: number }

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 } as const
const R = { strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const ICONS: Record<IconName, { viewBox: string; body: JSX.Element }> = {
  home: {
    viewBox: '0 0 18 18',
    body: (
      <path
        d="M3 8 9 3l6 5v6.5a1 1 0 0 1-1 1h-3v-4H7v4H4a1 1 0 0 1-1-1V8Z"
        {...S}
        strokeLinejoin="round"
      />
    ),
  },
  flag: {
    viewBox: '0 0 18 18',
    body: <path d="M4 15.5V3m0 0h8.5l-1.5 3 1.5 3H4" {...S} {...R} />,
  },
  doc: {
    viewBox: '0 0 18 18',
    body: (
      <path
        d="M5 2.5h5.5L14 6v9a.5.5 0 0 1-.5.5h-8.5A.5.5 0 0 1 4.5 15V3A.5.5 0 0 1 5 2.5ZM10 2.5V6.5h4M7 10h5M7 12.5h3.5"
        {...S}
        {...R}
      />
    ),
  },
  tag: {
    viewBox: '0 0 18 18',
    body: (
      <>
        <path d="M2.5 9V3.5a1 1 0 0 1 1-1H9l6.5 6.5-6.5 6.5L2.5 9Z" {...S} strokeLinejoin="round" />
        <circle cx="6" cy="6" r="1.2" fill="currentColor" />
      </>
    ),
  },
  users: {
    viewBox: '0 0 18 18',
    body: (
      <>
        <circle cx="7" cy="6" r="2.6" {...S} />
        <path
          d="M2 15c.6-2.5 2.6-4 5-4s4.4 1.5 5 4M12 3.6a2.6 2.6 0 0 1 0 4.8M13.5 11c1.3.5 2.2 1.7 2.5 3.5"
          {...S}
          strokeLinecap="round"
        />
      </>
    ),
  },
  jobs: {
    viewBox: '0 0 18 18',
    body: (
      <>
        <rect x="2.5" y="5.5" width="13" height="9" rx="1.5" {...S} />
        <path d="M6.5 5.5v-1A1.5 1.5 0 0 1 8 3h2a1.5 1.5 0 0 1 1.5 1.5v1M2.5 9.5h13" {...S} />
      </>
    ),
  },
  trophy: {
    viewBox: '0 0 18 18',
    body: (
      <path
        d="M5.5 3h7v4a3.5 3.5 0 0 1-7 0V3ZM9 10.5V13m-3 2h6M5.5 4.5H3a2.5 2.5 0 0 0 2.5 3M12.5 4.5H15a2.5 2.5 0 0 1-2.5 3"
        {...S}
        {...R}
      />
    ),
  },
  list: {
    viewBox: '0 0 18 18',
    body: (
      <path
        d="M6.5 4.5h9M6.5 9h9M6.5 13.5h9M2.5 4.5h1M2.5 9h1M2.5 13.5h1"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    ),
  },
  gear: {
    viewBox: '0 0 18 18',
    body: (
      <>
        <circle cx="9" cy="9" r="2.5" {...S} />
        <path
          d="M9 1.8v2M9 14.2v2M1.8 9h2M14.2 9h2M3.9 3.9l1.4 1.4M12.7 12.7l1.4 1.4M3.9 14.1l1.4-1.4M12.7 5.3l1.4-1.4"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </>
    ),
  },
  out: {
    viewBox: '0 0 18 18',
    body: (
      <path
        d="M7 3H4.5A1.5 1.5 0 0 0 3 4.5v9A1.5 1.5 0 0 0 4.5 15H7M11.5 12.5 15 9l-3.5-3.5M15 9H7"
        {...S}
        {...R}
      />
    ),
  },
  search: {
    viewBox: '0 0 16 16',
    body: (
      <>
        <circle cx="7" cy="7" r="5" {...S} />
        <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      </>
    ),
  },
  check: {
    viewBox: '0 0 14 14',
    body: <path d="m2.5 7.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth={1.8} {...R} />,
  },
  x: {
    viewBox: '0 0 14 14',
    body: (
      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    ),
  },
  up: {
    viewBox: '0 0 12 12',
    body: <path d="M3 7.5 6 4.5l3 3" fill="none" stroke="currentColor" strokeWidth={1.6} {...R} />,
  },
  menu: {
    viewBox: '0 0 18 18',
    body: (
      <path
        d="M3 5h12M3 9h12M3 13h12"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    ),
  },
  sun: {
    viewBox: '0 0 18 18',
    body: (
      <>
        <circle cx="9" cy="9" r="3.2" {...S} />
        <path
          d="M9 1.5v1.8M9 14.7v1.8M1.5 9h1.8M14.7 9h1.8M3.7 3.7l1.3 1.3M13 13l1.3 1.3M3.7 14.3 5 13M13 5l1.3-1.3"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </>
    ),
  },
  moon: {
    viewBox: '0 0 18 18',
    body: (
      <path d="M15 10.8A6.5 6.5 0 1 1 7.2 3a5.2 5.2 0 0 0 7.8 7.8Z" {...S} strokeLinejoin="round" />
    ),
  },
  ext: {
    viewBox: '0 0 14 14',
    body: (
      <path
        d="M8 2.5h3.5V6M11.5 2.5 6.5 7.5M10 8.5v2.5a.5.5 0 0 1-.5.5h-6.5a.5.5 0 0 1-.5-.5v-6.5a.5.5 0 0 1 .5-.5H5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        {...R}
      />
    ),
  },
  dl: {
    viewBox: '0 0 16 16',
    body: <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" {...S} {...R} />,
  },
  plus: {
    viewBox: '0 0 14 14',
    body: (
      <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    ),
  },
  eye: {
    viewBox: '0 0 18 18',
    body: (
      <>
        <path
          d="M1.5 9S4.2 3.8 9 3.8 16.5 9 16.5 9 13.8 14.2 9 14.2 1.5 9 1.5 9Z"
          {...S}
          strokeLinejoin="round"
        />
        <circle cx="9" cy="9" r="2.3" {...S} />
      </>
    ),
  },
  eyeOff: {
    viewBox: '0 0 18 18',
    body: (
      <>
        <path
          d="M2.5 2.5l13 13M7.4 4.1A7 7 0 0 1 9 3.8C13.8 3.8 16.5 9 16.5 9a12 12 0 0 1-2.2 2.9M5 5.3A12 12 0 0 0 1.5 9S4.2 14.2 9 14.2c1.1 0 2.1-.3 3-.7"
          {...S}
          {...R}
        />
        <path d="M7.6 7.7A2.3 2.3 0 0 0 10.3 10.4" {...S} {...R} />
      </>
    ),
  },
  globe: {
    viewBox: '0 0 18 18',
    body: (
      <>
        <circle cx="9" cy="9" r="6.5" {...S} />
        <path
          d="M2.5 9h13M9 2.5c1.8 1.8 2.7 4 2.7 6.5S10.8 13.7 9 15.5C7.2 13.7 6.3 11.5 6.3 9S7.2 4.3 9 2.5Z"
          {...S}
        />
      </>
    ),
  },
  shield: {
    viewBox: '0 0 18 18',
    body: (
      <path
        d="M9 2.5 3.5 4.5v4c0 3.5 2.4 6 5.5 7 3.1-1 5.5-3.5 5.5-7v-4L9 2.5Z"
        {...S}
        strokeLinejoin="round"
      />
    ),
  },
}

export default function Icon({ name, size = 16 }: IconProps) {
  const icon = ICONS[name]
  return (
    <svg width={size} height={size} viewBox={icon.viewBox} aria-hidden="true" focusable="false">
      {icon.body}
    </svg>
  )
}
