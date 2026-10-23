// Types provisoires, remplacés par ceux de src/api/api-types.ts une fois le contrat reçu.
export type JobType = 'permanent' | 'remote' | 'mission' | 'internship'
export type JobStatus = 'pending' | 'approved' | 'refused'

export type JobOffer = {
  id: number
  company: string
  title: string
  type: JobType
  city: string
  country: string
  technologies: string[]
  domainVerified: boolean
  salaryShown: boolean
  status: JobStatus
  refusalReason?: string
}

export const SAMPLE_JOBS: JobOffer[] = [
  {
    id: 1,
    company: 'Wave Mobile Money',
    title: 'Développeur back-end Java et Spring Boot',
    type: 'permanent',
    city: 'Dakar',
    country: 'Sénégal',
    technologies: ['Java 21', 'Spring Boot', 'PostgreSQL'],
    domainVerified: true,
    salaryShown: true,
    status: 'pending',
  },
  {
    id: 2,
    company: 'Jumia Technologies',
    title: 'Ingénieur front-end React',
    type: 'remote',
    city: 'Lagos',
    country: 'Nigeria',
    technologies: ['React', 'TypeScript', 'Vite'],
    domainVerified: true,
    salaryShown: false,
    status: 'pending',
  },
  {
    id: 3,
    company: 'Digital Plus Recrutement',
    title: 'Développeur web débutant, formation offerte',
    type: 'permanent',
    city: 'Dakar',
    country: 'Sénégal',
    technologies: ['PHP', 'WordPress'],
    domainVerified: false,
    salaryShown: false,
    status: 'pending',
  },
  {
    id: 4,
    company: 'Safaricom Digital',
    title: 'Intégration de l’API M-Pesa Daraja',
    type: 'mission',
    city: 'Nairobi',
    country: 'Kenya',
    technologies: ['Node.js', 'REST', 'M-Pesa'],
    domainVerified: true,
    salaryShown: true,
    status: 'pending',
  },
  {
    id: 5,
    company: 'Orange Digital Center',
    title: 'Stage en développement mobile Flutter',
    type: 'internship',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    technologies: ['Flutter', 'Dart'],
    domainVerified: true,
    salaryShown: true,
    status: 'approved',
  },
]
