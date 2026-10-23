// Types provisoires, remplacés par ceux de src/api/api-types.ts une fois le contrat reçu.
export type Challenge = {
  id: number
  title: string
  brief: string
  points: number
  endsOn: string
}

export type Submission = {
  id: number
  member: string
  country: string
  repoUrl: string
  score: number | null
}

export const SAMPLE_CHALLENGE: Challenge = {
  id: 1,
  title: 'Un convertisseur de montants en FCFA hors ligne',
  brief:
    'Construire une petite application qui convertit des montants entre FCFA, naira et shilling kényan, et reste utilisable sans réseau.',
  points: 20,
  endsOn: '2026-10-25',
}

export const SAMPLE_SUBMISSIONS: Submission[] = [
  {
    id: 1,
    member: 'Aminata Diallo',
    country: 'Sénégal',
    repoUrl: 'https://github.com/aminata-diallo/convertisseur-fcfa',
    score: 88,
  },
  {
    id: 2,
    member: 'Kossi Mensah',
    country: 'Togo',
    repoUrl: 'https://github.com/kossi-mensah/fcfa-offline',
    score: null,
  },
  {
    id: 3,
    member: 'Chinedu Okafor',
    country: 'Nigeria',
    repoUrl: 'javascript:alert(1)',
    score: null,
  },
]
