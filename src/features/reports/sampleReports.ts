import type { ContestItem, ReportItem } from './types'

export const SAMPLE_REPORTS: ReportItem[] = [
  {
    id: 1,
    target: 'answer',
    reason: 'spam',
    count: 6,
    excerpt:
      'Gagnez 500 000 FCFA par semaine sans effort, écrivez-moi sur WhatsApp pour rejoindre le groupe.',
    author: 'Yao Kouassi',
    country: 'Côte d’Ivoire',
    reportedAt: '2026-10-20T08:14:00Z',
    status: 'pending',
  },
  {
    id: 2,
    target: 'offer',
    reason: 'fraudulentOffer',
    count: 4,
    excerpt:
      'Développeur web débutant accepté, formation offerte. Frais d’inscription de 25 000 FCFA à régler par Orange Money avant l’entretien.',
    author: 'Digital Plus Recrutement',
    country: 'Sénégal',
    reportedAt: '2026-10-20T10:40:00Z',
    status: 'pending',
  },
  {
    id: 3,
    target: 'question',
    reason: 'offTopic',
    count: 2,
    excerpt: 'Quelqu’un connaît une bonne recette de thiéboudienne pour dimanche ?',
    author: 'Fatou Ndiaye',
    country: 'Sénégal',
    reportedAt: '2026-10-21T07:05:00Z',
    status: 'pending',
  },
  {
    id: 4,
    target: 'profile',
    reason: 'impersonation',
    count: 3,
    excerpt: 'Ibrahim Traoré, ingénieur principal chez Orange Burkina (profil créé hier).',
    author: 'Ibrahim Traore',
    country: 'Burkina Faso',
    reportedAt: '2026-10-21T09:30:00Z',
    status: 'pending',
  },
  {
    id: 5,
    target: 'answer',
    reason: 'offensive',
    count: 5,
    excerpt:
      'Tu ne comprends rien au Java, retourne apprendre les bases avant de poser des questions.',
    author: 'Chinedu Okafor',
    country: 'Nigeria',
    reportedAt: '2026-10-21T11:12:00Z',
    status: 'pending',
  },
  {
    id: 6,
    target: 'mission',
    reason: 'spam',
    count: 5,
    excerpt: 'Mission urgente : copier-coller des annonces sur 200 sites, 2 000 FCFA par jour.',
    author: 'Wanjiru Kamau',
    country: 'Kenya',
    reportedAt: '2026-10-19T16:20:00Z',
    status: 'hidden',
  },
]

export const SAMPLE_CONTESTS: ContestItem[] = [
  {
    id: 1,
    target: 'question',
    excerpt:
      'Webhook Wave Checkout : la signature est refusée en production avec Spring Boot 3, réseau instable à Kankan.',
    author: 'Moussa Coulibaly',
    country: 'Côte d’Ivoire',
    message:
      'Ma question est technique et parle bien de l’API Wave. Elle a été masquée par erreur après des signalements groupés.',
    status: 'pending',
  },
  {
    id: 2,
    target: 'answer',
    excerpt:
      'Utilise le mode hors ligne de la PWA et mets en cache les dernières réponses consultées.',
    author: 'Amina Bello',
    country: 'Nigeria',
    message: 'Ma réponse est correcte et a été acceptée par l’auteur de la question.',
    status: 'pending',
  },
]
