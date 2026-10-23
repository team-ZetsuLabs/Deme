// Types provisoires, remplacés par ceux de src/api/api-types.ts une fois le contrat reçu.
export type TagItem = { id: number; name: string; usage: number }

export const SAMPLE_TAGS: TagItem[] = [
  { id: 1, name: 'spring-boot', usage: 42 },
  { id: 2, name: 'mobile-money', usage: 31 },
  { id: 3, name: 'wave-api', usage: 12 },
  { id: 4, name: 'react', usage: 58 },
  { id: 5, name: 'postgresql', usage: 27 },
  { id: 6, name: 'reseau-instable', usage: 9 },
  { id: 7, name: 'm-pesa', usage: 0 },
  { id: 8, name: 'springboot', usage: 3 },
]
