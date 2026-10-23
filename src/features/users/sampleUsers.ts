// Types provisoires, remplacés par ceux de src/api/api-types.ts une fois le contrat reçu.
export type UserLevel = 'NEWCOMER' | 'MEMBER' | 'CONTRIBUTOR' | 'REFERENT'
export type UserRole = 'member' | 'recruiter' | 'moderator' | 'administrator'

export type UserItem = {
  id: number
  name: string
  email: string
  country: string
  level: UserLevel
  reputation: number
  role: UserRole
  suspended: boolean
}

export const SAMPLE_USERS: UserItem[] = [
  {
    id: 1,
    name: 'Aminata Diallo',
    email: 'aminata.diallo@example.com',
    country: 'Sénégal',
    level: 'REFERENT',
    reputation: 1820,
    role: 'member',
    suspended: false,
  },
  {
    id: 2,
    name: 'Kossi Mensah',
    email: 'kossi.mensah@example.com',
    country: 'Togo',
    level: 'CONTRIBUTOR',
    reputation: 640,
    role: 'member',
    suspended: false,
  },
  {
    id: 3,
    name: 'Chinedu Okafor',
    email: 'chinedu.okafor@example.com',
    country: 'Nigeria',
    level: 'MEMBER',
    reputation: 120,
    role: 'member',
    suspended: false,
  },
  {
    id: 4,
    name: 'Wanjiru Kamau',
    email: 'wanjiru.kamau@example.com',
    country: 'Kenya',
    level: 'CONTRIBUTOR',
    reputation: 910,
    role: 'recruiter',
    suspended: false,
  },
  {
    id: 5,
    name: 'Yao Kouassi',
    email: 'yao.kouassi@example.com',
    country: 'Côte d’Ivoire',
    level: 'NEWCOMER',
    reputation: 5,
    role: 'member',
    suspended: true,
  },
  {
    id: 6,
    name: 'Ibrahim Traoré',
    email: 'ibrahim.traore@example.com',
    country: 'Burkina Faso',
    level: 'MEMBER',
    reputation: 85,
    role: 'moderator',
    suspended: false,
  },
]
