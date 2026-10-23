/** Icônes maison (reprises de la maquette), rendues une seule fois dans App. */
export function IconSprite() {
  const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 } as const;
  const round = { ...line, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <symbol id="i-github" viewBox="0 0 16 16">
        <path
          fill="currentColor"
          d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.22 1.88.87 2.34.67.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z"
        />
      </symbol>
      <symbol id="i-google" viewBox="0 0 18 18">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
        />
        <path
          fill="#FBBC05"
          d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
        />
      </symbol>
      <symbol id="i-help" viewBox="0 0 18 18">
        <path
          {...line}
          strokeLinejoin="round"
          d="M3 4.5A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5v6a1.5 1.5 0 0 1-1.5 1.5H8l-3.5 3v-3A1.5 1.5 0 0 1 3 10.5v-6Z"
        />
      </symbol>
      <symbol id="i-jobs" viewBox="0 0 18 18">
        <rect {...line} x="2.5" y="5.5" width="13" height="9" rx="1.5" />
        <path {...line} d="M6.5 5.5v-1A1.5 1.5 0 0 1 8 3h2a1.5 1.5 0 0 1 1.5 1.5v1M2.5 9.5h13" />
      </symbol>
      <symbol id="i-mission" viewBox="0 0 18 18">
        <path
          {...round}
          d="M11.8 2.6a3.6 3.6 0 0 0-3.6 4.8L2.8 12.8a1.5 1.5 0 0 0 2.1 2.1l5.4-5.4a3.6 3.6 0 0 0 4.8-3.6l-2.1 2.1-2-.5-.5-2 2.1-2.1a3.6 3.6 0 0 0-.8-.8Z"
        />
      </symbol>
      <symbol id="i-trophy" viewBox="0 0 18 18">
        <path
          {...round}
          d="M5.5 3h7v4a3.5 3.5 0 0 1-7 0V3ZM9 10.5V13m-3 2h6M5.5 4.5H3a2.5 2.5 0 0 0 2.5 3M12.5 4.5H15a2.5 2.5 0 0 1-2.5 3"
        />
      </symbol>
      <symbol id="i-user" viewBox="0 0 18 18">
        <circle {...line} cx="9" cy="6" r="3" />
        <path {...round} d="M3 15.5c.8-2.8 3.2-4.5 6-4.5s5.2 1.7 6 4.5" />
      </symbol>
      <symbol id="i-users" viewBox="0 0 18 18">
        <circle {...line} cx="6.5" cy="6.5" r="2.5" />
        <circle {...line} cx="12.5" cy="7.5" r="2" />
        <path
          {...round}
          d="M1.8 15c.6-2.5 2.5-4 4.7-4s4.1 1.5 4.7 4M11.5 11.2c2 0 3.8 1.3 4.4 3.3"
        />
      </symbol>
      <symbol id="i-bell" viewBox="0 0 18 18">
        <path
          {...line}
          strokeLinejoin="round"
          d="M4.5 12.5V8a4.5 4.5 0 0 1 9 0v4.5l1.5 1.5H3l1.5-1.5ZM7.5 15.5a1.5 1.5 0 0 0 3 0"
        />
      </symbol>
      <symbol id="i-gear" viewBox="0 0 18 18">
        <circle {...line} cx="9" cy="9" r="2.5" />
        <path
          {...round}
          d="M9 1.8v2M9 14.2v2M1.8 9h2M14.2 9h2M3.9 3.9l1.4 1.4M12.7 12.7l1.4 1.4M3.9 14.1l1.4-1.4M12.7 5.3l1.4-1.4"
        />
      </symbol>
      <symbol id="i-out" viewBox="0 0 18 18">
        <path
          {...round}
          d="M7 3H4.5A1.5 1.5 0 0 0 3 4.5v9A1.5 1.5 0 0 0 4.5 15H7M11.5 12.5 15 9l-3.5-3.5M15 9H7"
        />
      </symbol>
      <symbol id="i-search" viewBox="0 0 16 16">
        <circle {...line} cx="7" cy="7" r="5" />
        <path {...round} d="m11 11 3.5 3.5" />
      </symbol>
      <symbol id="i-up" viewBox="0 0 12 12">
        <path {...round} strokeWidth={1.8} d="M2 8l4-4 4 4" />
      </symbol>
      <symbol id="i-check" viewBox="0 0 14 14">
        <path {...round} strokeWidth={1.8} d="m2.5 7.5 3 3 6-7" />
      </symbol>
      <symbol id="i-x" viewBox="0 0 14 14">
        <path {...round} strokeWidth={1.6} d="M3 3l8 8M11 3l-8 8" />
      </symbol>
      <symbol id="i-pin" viewBox="0 0 16 16">
        <path
          {...line}
          strokeWidth={1.4}
          d="M8 14.5s-4.5-4.2-4.5-7.5a4.5 4.5 0 0 1 9 0c0 3.3-4.5 7.5-4.5 7.5Z"
        />
        <circle {...line} strokeWidth={1.4} cx="8" cy="7" r="1.6" />
      </symbol>
      <symbol id="i-cal" viewBox="0 0 16 16">
        <rect {...line} strokeWidth={1.4} x="2.5" y="3.5" width="11" height="10" rx="1.5" />
        <path {...round} strokeWidth={1.4} d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
      </symbol>
      <symbol id="i-sun" viewBox="0 0 18 18">
        <circle {...line} cx="9" cy="9" r="3.2" />
        <path
          {...round}
          d="M9 1.5v1.8M9 14.7v1.8M1.5 9h1.8M14.7 9h1.8M3.7 3.7l1.3 1.3M13 13l1.3 1.3M3.7 14.3 5 13M13 5l1.3-1.3"
        />
      </symbol>
      <symbol id="i-moon" viewBox="0 0 18 18">
        <path
          {...line}
          strokeLinejoin="round"
          d="M15 10.8A6.5 6.5 0 1 1 7.2 3a5.2 5.2 0 0 0 7.8 7.8Z"
        />
      </symbol>
      <symbol id="i-star" viewBox="0 0 16 16">
        <path
          {...line}
          strokeWidth={1.4}
          strokeLinejoin="round"
          d="m8 2 1.8 3.8 4.2.5-3.1 2.9.8 4.1L8 11.3l-3.7 2 .8-4.1L2 6.3l4.2-.5L8 2Z"
        />
      </symbol>
      <symbol id="i-offline" viewBox="0 0 18 18">
        <path
          {...round}
          d="M2 6.5a10.5 10.5 0 0 1 14 0M4.5 9.3a7 7 0 0 1 9 0M7 12a3.4 3.4 0 0 1 4 0M2.5 2.5l13 13"
        />
      </symbol>
      <symbol id="i-flag" viewBox="0 0 16 16">
        <path {...round} strokeWidth={1.4} d="M3.5 14.5V2.5M3.5 3h8l-1.6 3 1.6 3h-8" />
      </symbol>
      <symbol id="i-clock" viewBox="0 0 16 16">
        <circle {...line} strokeWidth={1.4} cx="8" cy="8" r="6" />
        <path {...round} strokeWidth={1.4} d="M8 4.8V8l2.2 1.4" />
      </symbol>
    </svg>
  );
}
