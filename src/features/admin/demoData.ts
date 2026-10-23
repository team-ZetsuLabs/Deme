// Données de démonstration en attendant l'API. Les dates sont relatives à l'instant présent.
import type {
  AuditEntry,
  Challenge,
  ContentItem,
  PendingJob,
  PublishedJob,
  RefusedJob,
  Report,
  Settings,
  StaffMember,
  Submission,
  Tag,
  User,
} from './types'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export const CURRENT_ADMIN_ID = 'admin'

const isoDay = (now: number, offsetDays: number) =>
  new Date(now + offsetDays * DAY).toISOString().slice(0, 10)

export const COUNTRIES = [
  'Burkina Faso',
  'Sénégal',
  "Côte d'Ivoire",
  'Ghana',
  'Mali',
  'Kenya',
  'Maroc',
  'Bénin',
  'Nigeria',
  'Togo',
]

export const slugOf = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const NAMES = [
  'Awa Kane',
  'Ibrahim Sawadogo',
  'Kwame Asante',
  'Fatou Diallo',
  'Moussa Traoré',
  'Grace Njeri',
  'Youssef Benali',
  'Aïcha Ouattara',
  'Koffi Mensah',
  'Nadia Benjelloun',
  'Seydou Ouédraogo',
  'Amina Bello',
  'Jean-Marc Kouassi',
  'Rokia Coulibaly',
  'Chinedu Okafor',
  'Fanta Camara',
  'Ousmane Sy',
  'Esi Boateng',
  'Tidiane Ba',
  'Lamine Diop',
  'Adjoa Owusu',
  'Bakary Konaté',
  'Zeinab Hamidou',
  'spam_promo_2026',
]

const REPUTATION = [
  875, 790, 980, 455, 310, 640, 515, 120, 260, 95, 410, 33, 188, 72, 530, 14, 222, 61, 300, 150, 45,
  9, 18,
]

export function buildUsers(): User[] {
  return NAMES.map((name, i) => {
    const id = slugOf(name)
    const spam = name.startsWith('spam')
    return {
      id,
      name,
      email: spam ? 'promo.deals@mail.xyz' : `${id.replace(/-/g, '.')}@exemple.com`,
      country: spam ? null : COUNTRIES[i % COUNTRIES.length],
      role: i === 3 ? 'moderator' : 'member',
      rep: spam ? 1 : (REPUTATION[i] ?? 10),
      joinedDays: spam ? 2 : 10 + ((i * 37) % 290),
      status: spam ? 'flagged' : i === 21 ? 'suspended' : 'active',
      questions: spam ? 0 : (i * 7) % 23,
      answers: spam ? 0 : (i * 11) % 41,
      provider: (['GitHub', 'Google', 'Email'] as const)[i % 3],
      warnings: i === 4 ? 1 : i === 21 ? 2 : 0,
      flags: spam ? 4 : 0,
    }
  })
}

export function buildReports(now: number): Report[] {
  return [
    {
      id: 101,
      type: 'answer',
      reason: 'spam',
      count: 4,
      at: now - 12 * MIN,
      author: 'spam-promo-2026',
      reporters: ['kwame-asante', 'awa-kane', 'fatou-diallo', 'grace-njeri'],
      context: {
        kind: 'answerTo',
        title: "L'API Orange Money renvoie 401 alors que le token est généré",
      },
      content:
        "Arrêtez de chercher ! Formation complète Mobile Money à -90 %, lien en bio, offre valable aujourd'hui seulement !!!",
    },
    {
      id: 102,
      type: 'question',
      reason: 'offensive',
      count: 2,
      at: now - 40 * MIN,
      author: 'moussa-traore',
      reporters: ['youssef-benali', 'aicha-ouattara'],
      context: { kind: 'questionIn', tag: 'laravel' },
      content:
        "Pourquoi les devs de ce forum sont aussi nuls ? Personne n'est capable de m'expliquer une simple intégration Wave.",
    },
    {
      id: 103,
      type: 'profile',
      reason: 'impersonation',
      count: 1,
      at: now - 2 * HOUR,
      author: 'koffi-mensah',
      reporters: ['ibrahim-sawadogo'],
      context: { kind: 'profileIntro' },
      content:
        "Lead developer chez Orange Money Afrique. Je recrute, envoyez-moi vos CV et une copie de votre pièce d'identité en message privé.",
    },
    {
      id: 104,
      type: 'answer',
      reason: 'offTopic',
      count: 1,
      at: now - 3 * HOUR,
      author: 'esi-boateng',
      reporters: ['fatou-diallo'],
      context: {
        kind: 'answerTo',
        title: 'PostgreSQL dans Docker perd ses données au redémarrage',
      },
      content:
        "Moi j'utilise MongoDB et je n'ai jamais eu ce problème, vous devriez changer de base.",
    },
    {
      id: 105,
      type: 'offer',
      reason: 'fraudulentOffer',
      count: 3,
      at: now - DAY,
      author: 'spam-promo-2026',
      reporters: ['awa-kane', 'grace-njeri', 'lamine-diop'],
      context: { kind: 'offer', title: 'Développeur junior, 3 000 € par semaine, sans expérience' },
      content:
        "Travail à domicile, aucune expérience requise. Frais d'inscription de 25 000 F CFA à régler par Mobile Money avant l'entretien.",
    },
    {
      id: 106,
      type: 'answer',
      reason: 'spam',
      count: 2,
      at: now - DAY - 2 * HOUR,
      author: 'chinedu-okafor',
      reporters: ['kwame-asante', 'tidiane-ba'],
      context: {
        kind: 'answerTo',
        title: 'Garder une app Flutter utilisable quand la connexion coupe',
      },
      content:
        'Utilisez mon package flutter_offline_pro, lien sur mon GitHub, 5 étoiles garanties.',
    },
  ]
}

export const DEMO_CONTENTS: ContentItem[] = [
  {
    id: 1,
    title: "L'API Orange Money renvoie 401 alors que le token est généré",
    author: 'awa-kane',
    tags: ['mobile-money', 'node.js'],
    answers: 3,
    flags: 0,
    status: 'published',
    daysAgo: 0,
  },
  {
    id: 2,
    title: 'LazyInitializationException sur une relation @OneToMany avec Spring Boot',
    author: 'ibrahim-sawadogo',
    tags: ['spring-boot', 'jpa'],
    answers: 3,
    flags: 0,
    status: 'published',
    daysAgo: 0,
  },
  {
    id: 3,
    title: 'Garder une app Flutter utilisable quand la connexion coupe',
    author: 'kwame-asante',
    tags: ['flutter', 'sqlite'],
    answers: 2,
    flags: 1,
    status: 'published',
    daysAgo: 1,
  },
  {
    id: 4,
    title: 'PostgreSQL dans Docker perd ses données au redémarrage',
    author: 'fatou-diallo',
    tags: ['docker', 'postgresql'],
    answers: 1,
    flags: 1,
    status: 'published',
    daysAgo: 1,
  },
  {
    id: 5,
    title: 'Gérer Wave et Moov Money dans la même application Laravel',
    author: 'moussa-traore',
    tags: ['laravel', 'mobile-money'],
    answers: 2,
    flags: 0,
    status: 'published',
    daysAgo: 2,
  },
  {
    id: 7,
    title: 'Pourquoi les devs de ce forum sont aussi nuls ?',
    author: 'moussa-traore',
    tags: ['laravel'],
    answers: 0,
    flags: 2,
    status: 'published',
    daysAgo: 0,
  },
  {
    id: 8,
    title: 'Formation Mobile Money à -90 %',
    author: 'spam-promo-2026',
    tags: ['mobile-money'],
    answers: 0,
    flags: 5,
    status: 'hidden',
    daysAgo: 1,
  },
  {
    id: 9,
    title: 'Comment déployer une app Spring Boot sur un VPS ?',
    author: 'seydou-ouedraogo',
    tags: ['spring-boot', 'devops'],
    answers: 6,
    flags: 0,
    status: 'closed',
    daysAgo: 7,
  },
  {
    id: 10,
    title: 'React Native ou Flutter pour une app de livraison à Abidjan ?',
    author: 'jean-marc-kouassi',
    tags: ['flutter', 'react-native'],
    answers: 9,
    flags: 0,
    status: 'published',
    daysAgo: 8,
  },
]

export const DEMO_TAGS: Tag[] = [
  { name: 'mobile-money', count: 186, synonyms: ['momo', 'orange-money'], createdDaysAgo: 280 },
  { name: 'spring-boot', count: 241, synonyms: ['springboot'], createdDaysAgo: 280 },
  { name: 'flutter', count: 203, synonyms: [], createdDaysAgo: 280 },
  { name: 'laravel', count: 158, synonyms: [], createdDaysAgo: 280 },
  { name: 'docker', count: 132, synonyms: [], createdDaysAgo: 250 },
  { name: 'react', count: 175, synonyms: ['reactjs'], createdDaysAgo: 280 },
  { name: 'postgresql', count: 97, synonyms: ['postgres'], createdDaysAgo: 250 },
  { name: 'springboot-3', count: 6, synonyms: [], createdDaysAgo: 40 },
  { name: 'hors-ligne', count: 41, synonyms: ['offline'], createdDaysAgo: 220 },
  { name: 'wave', count: 0, synonyms: [], createdDaysAgo: 5 },
]

export function buildPendingJobs(now: number): PendingJob[] {
  return [
    {
      id: 201,
      title: 'Développeur back-end Node.js',
      company: 'PayDunya',
      city: 'Dakar',
      type: 'permanent',
      by: 'rh@paydunya.example',
      at: now - HOUR,
      checks: [
        { key: 'domain', ok: true },
        { key: 'pay', ok: true },
        { key: 'description', ok: true },
      ],
      about: 'Conception et maintenance des API de paiement.',
      missions: ["Développer de nouvelles intégrations d'opérateurs", 'Améliorer la supervision'],
    },
    {
      id: 202,
      title: 'Développeur junior, 3 000 € par semaine, sans expérience',
      company: 'Global Remote Jobs',
      city: null,
      type: 'mission',
      by: 'promo.deals@mail.xyz',
      at: now - 3 * HOUR,
      checks: [
        { key: 'domain', ok: false },
        { key: 'pay', ok: true },
        { key: 'description', ok: false },
      ],
      about: 'Travail à domicile, aucune expérience requise.',
      missions: ["Frais d'inscription à régler avant l'entretien"],
    },
    {
      id: 203,
      title: 'Stage développeur mobile Flutter',
      company: "Kiro'o Games",
      city: 'Yaoundé',
      type: 'internship',
      by: 'jobs@kiroo.example',
      at: now - DAY,
      checks: [
        { key: 'domain', ok: true },
        { key: 'pay', ok: false },
        { key: 'description', ok: true },
      ],
      about: 'Studio de jeux vidéo camerounais.',
      missions: ['Prototyper des mini-jeux en Flutter', 'Participer aux tests utilisateurs'],
    },
  ]
}

export const DEMO_PUBLISHED_JOBS: PublishedJob[] = [
  {
    title: 'Développeur full-stack Spring Boot et React',
    company: 'Sahel Paiements',
    daysAgo: 1,
    applicants: 14,
  },
  { title: 'Développeur mobile Flutter', company: 'AgriLien', daysAgo: 2, applicants: 22 },
  { title: 'Ingénieur DevOps', company: 'Teranga Cloud', daysAgo: 3, applicants: 7 },
  {
    title: "Intégration d'une API de paiement mobile",
    company: 'Boutik Express',
    daysAgo: 4,
    applicants: 9,
  },
  { title: 'Stage développeur web, 6 mois', company: 'Faso Numérique', daysAgo: 5, applicants: 31 },
]

export const DEMO_REFUSED_JOBS: RefusedJob[] = [
  {
    title: 'Commercial terrain, vente de crédit',
    company: 'Télé Plus',
    daysAgo: 6,
    reason: 'notDev',
  },
]

export function buildChallenges(now: number): Challenge[] {
  const day = (offset: number) => new Date(now + offset * DAY).toISOString().slice(0, 10)
  return [
    {
      id: 1,
      title: 'Simuler une API de paiement mobile',
      status: 'ongoing',
      start: day(-3),
      end: day(3),
      submissions: 38,
      points: 20,
    },
    {
      id: 2,
      title: 'Tableau de bord météo hors connexion',
      status: 'upcoming',
      start: day(4),
      end: day(10),
      submissions: 0,
      points: 20,
    },
    {
      id: 3,
      title: "Raccourcisseur d'URL",
      status: 'finished',
      start: day(-10),
      end: day(-4),
      submissions: 52,
      points: 20,
    },
    {
      id: 4,
      title: 'Bot Telegram de météo',
      status: 'finished',
      start: day(-17),
      end: day(-11),
      submissions: 41,
      points: 20,
    },
  ]
}

export function buildSubmissions(now: number): Submission[] {
  return [
    { id: 1, user: 'kwame-asante', repo: 'kwamea/momo-sim', at: now - HOUR, status: 'toGrade' },
    {
      id: 2,
      user: 'awa-kane',
      repo: 'awakane/fake-mobile-money',
      at: now - 3 * HOUR,
      status: 'validated',
      score: 92,
    },
    {
      id: 3,
      user: 'ibrahim-sawadogo',
      repo: 'isawadogo/pay-simulator',
      at: now - DAY,
      status: 'toGrade',
    },
    {
      id: 4,
      user: 'grace-njeri',
      repo: 'gnjeri/mpesa-like-api',
      at: now - DAY - 2 * HOUR,
      status: 'validated',
      score: 88,
    },
    {
      id: 5,
      user: 'fanta-camara',
      repo: 'fcamara/api-paiement',
      at: now - 2 * DAY,
      status: 'rejected',
      note: 'empty',
    },
  ]
}

export function buildAudit(now: number): AuditEntry[] {
  return [
    {
      id: 6,
      at: now - 5 * HOUR,
      who: 'mariam',
      action: 'contentHidden',
      target: 'Formation Mobile Money à -90 %',
      detail: { key: 'spamReports', params: { count: 5, reason: 't:reports.reason.spam' } },
    },
    {
      id: 5,
      at: now - 8 * HOUR,
      who: 'salif',
      action: 'jobApproved',
      target: 'Développeur full-stack Spring Boot et React',
      detail: 'Sahel Paiements',
    },
    {
      id: 4,
      at: now - DAY,
      who: 'eric',
      action: 'warningSent',
      target: 'Moussa Traoré',
      detail: { key: 'aggressiveTone' },
    },
    {
      id: 3,
      at: now - DAY - 8 * HOUR,
      who: 'admin',
      action: 'challengeCreated',
      target: 'Tableau de bord météo hors connexion',
      detail: {
        key: 'period',
        params: { from: `d:${isoDay(now, 4)}`, to: `d:${isoDay(now, 10)}` },
      },
    },
    {
      id: 2,
      at: now - 2 * DAY,
      who: 'salif',
      action: 'accountSuspended',
      target: 'Bakary Konaté',
      detail: { key: 'repeatedSpam', params: { duration: 't:users.durations.30d' } },
    },
    {
      id: 1,
      at: now - 2 * DAY - 6 * HOUR,
      who: 'mariam',
      action: 'tagsMerged',
      target: 'momo → mobile-money',
      detail: { key: 'questionsMoved', params: { count: 12 } },
    },
  ]
}

export const DEMO_STAFF: StaffMember[] = [
  {
    id: 'admin',
    name: 'Benhasser Ouedraogo',
    email: 'admin@zetsu.dev',
    role: 'administrator',
    lastSeen: { kind: 'online' },
  },
  {
    id: 'salif',
    name: 'Salif Kaboré',
    email: 'salif@zetsu.dev',
    role: 'administrator',
    lastSeen: { kind: 'hours', value: 2 },
  },
  {
    id: 'mariam',
    name: 'Mariam Sanou',
    email: 'mariam@zetsu.dev',
    role: 'moderator',
    lastSeen: { kind: 'minutes', value: 20 },
  },
  {
    id: 'eric',
    name: 'Éric Zida',
    email: 'eric@zetsu.dev',
    role: 'moderator',
    lastSeen: { kind: 'days', value: 1 },
  },
]

export const DEMO_SETTINGS: Settings = {
  autoHide: 5,
  manualJobs: true,
  require2fa: true,
  session: '8h',
  banned: "arnaque, frais d'inscription, gagner de l'argent rapidement",
}

/* Séries quotidiennes, déterministes, sur 90 jours */
export function series(seed: number, base: number, amp: number): number[] {
  let x = seed
  return Array.from({ length: 90 }, (_, i) => {
    x = (x * 9301 + 49297) % 233280
    const trend = base + i * (base / 140)
    const weekly = [0.75, 1.05, 1.12, 1.1, 1.05, 0.95, 0.7][(i + 3) % 7]
    return Math.round(trend * weekly + (x / 233280 - 0.5) * amp)
  })
}

export const DAILY_QUESTIONS = series(7, 34, 14)
export const DAILY_ANSWERS = series(42, 71, 24)
export const DAILY_SIGNUPS = series(99, 22, 10)
export const TAG_SHARE: Record<string, number> = {
  'spring-boot': 0.19,
  flutter: 0.16,
  'mobile-money': 0.15,
  react: 0.14,
  laravel: 0.12,
  docker: 0.1,
}
