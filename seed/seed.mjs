// Données de démonstration de Dɛmɛ, créées par l'API (jamais directement en base) pour que
// la réputation, les niveaux, le masquage automatique et les notifications suivent les vraies règles.
// Rejouable : un compte, une question ou une offre déjà présents sont reconnus et sautés.
//
//   SEED_API_URL=https://... SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... node seed/seed.mjs
//
// Voir seed/README.md. Aucun mot de passe n'est écrit dans ce dépôt.
import {
  ASKERS,
  CHALLENGES,
  COMMUNITIES,
  CORE,
  JOBS,
  MISSIONS,
  PLAYTESTS,
  PROJECTS,
  QUESTIONS,
  RECRUITERS,
  RUDE,
  RUDE_QUESTION,
  SPAMMER,
  SPAM_ANSWERS,
  SUBMISSION_REPOS,
  UNUSED_TAGS,
} from './data.mjs'

const API = (process.env.SEED_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD
const MEMBER_PASSWORD = process.env.SEED_MEMBER_PASSWORD ?? 'zetsu2026demo'
const MEMBER_DOMAIN = process.env.SEED_MEMBER_DOMAIN ?? 'exemple.com'
const PAUSE_MS = Number(process.env.SEED_PAUSE_MS ?? 400)

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Définissez SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD (compte administrateur).')
  process.exit(1)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const log = (message) => console.log(message)
const warn = (message) => console.warn(`  ! ${message}`)

class ApiFailure extends Error {
  constructor(status, body, method, path) {
    super(`${method} ${path} -> ${status} ${body?.code ?? ''} ${body?.message ?? ''}`.trim())
    this.status = status
    this.code = body?.code
  }
}

/** Client HTTP minimal avec cookie de session, jeton CSRF et nouvel essai sur 429 et pannes réseau. */
class Client {
  jar = new Map()
  credentials = null

  async request(method, path, body, tolerated = []) {
    const write = method !== 'GET'
    let retriedLogin = false
    for (let attempt = 0; attempt < 8; attempt++) {
      // Le jeton CSRF d'abord : sa demande pose le cookie qui doit accompagner la requête.
      const token = write ? await this.csrf() : undefined
      const headers = { Accept: 'application/json' }
      if (body !== undefined) headers['Content-Type'] = 'application/json'
      if (token) headers['X-XSRF-TOKEN'] = token
      if (this.jar.size) headers.Cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join('; ')
      let response
      try {
        response = await fetch(`${API}/api/v1${path}`, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.timeout(120_000),
        })
      } catch {
        await sleep(2000 * (attempt + 1))
        continue
      }
      for (const cookie of response.headers.getSetCookie?.() ?? []) {
        const [pair] = cookie.split(';')
        const index = pair.indexOf('=')
        this.jar.set(pair.slice(0, index), pair.slice(index + 1))
      }
      if (response.status === 429 || response.status >= 502) {
        await sleep(Math.min(65_000, 4000 * 2 ** attempt))
        continue
      }
      const text = await response.text()
      const data = text ? JSON.parse(text) : null
      if (path === '/auth/login' && response.ok) this.credentials = body
      // Session perdue (le serveur gratuit redémarre) : on se reconnecte une fois puis on rejoue l'appel.
      if (
        response.status === 401 &&
        this.credentials &&
        !path.startsWith('/auth/') &&
        !retriedLogin
      ) {
        retriedLogin = true
        this.jar.clear()
        await this.request('POST', '/auth/login', this.credentials)
        attempt -= 1
        continue
      }
      if (response.ok || tolerated.includes(response.status) || tolerated.includes(data?.code)) {
        await sleep(PAUSE_MS)
        return { status: response.status, data }
      }
      throw new ApiFailure(response.status, data, method, path)
    }
    throw new Error(`${method} ${path} : trop d'échecs réseau ou de limitations de débit`)
  }

  async csrf() {
    const existing = this.jar.get('XSRF-TOKEN')
    if (existing) return existing
    const { data } = await this.request('GET', '/auth/csrf')
    return data.token
  }

  get = (path, tolerated) => this.request('GET', path, undefined, tolerated)
  post = (path, body, tolerated) => this.request('POST', path, body ?? {}, tolerated)
  put = (path, body, tolerated) => this.request('PUT', path, body ?? {}, tolerated)
}

async function pages(client, path, size = 50) {
  const items = []
  const separator = path.includes('?') ? '&' : '?'
  for (let page = 0; ; page++) {
    const { data } = await client.get(`${path}${separator}page=${page}&size=${size}`)
    items.push(...data.items)
    if ((page + 1) * data.size >= data.total || data.items.length === 0) return items
  }
}

const stats = {}
const count = (key, n = 1) => (stats[key] = (stats[key] ?? 0) + n)

async function main() {
  log(`Back-end : ${API}`)
  const admin = new Client()
  await admin.post('/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  const adminMe = (await admin.get('/auth/me')).data
  if (adminMe.role !== 'ADMIN')
    throw new Error(`${ADMIN_EMAIL} n'est pas administrateur (rôle ${adminMe.role}).`)
  log(`Administrateur : ${adminMe.displayName}`)

  // 1. Comptes
  log('\n1. Comptes')
  const members = new Map()
  const everyone = [...CORE, ...ASKERS, SPAMMER, RUDE, ...RECRUITERS]
  for (const person of everyone) {
    const client = new Client()
    const email = `${person.handle}@${MEMBER_DOMAIN}`
    const registered = await client.post(
      '/auth/register',
      { displayName: person.name, email, password: MEMBER_PASSWORD, countryCode: person.country },
      [409],
    )
    if (registered.status === 409) {
      await client.post('/auth/login', { email, password: MEMBER_PASSWORD })
      log(`  = ${person.name} existe déjà`)
    } else {
      count('comptes créés')
      log(`  + ${person.name}`)
      await client.put('/users/me/onboarding', {
        technologies: person.tech,
        countryCode: person.country,
        language: 'fr',
      })
    }
    members.set(person.handle, { ...person, client, me: (await client.get('/auth/me')).data })
  }
  const who = (handle) => members.get(handle)

  // 2. Rôles Recruteur donnés par l'administrateur
  for (const recruiter of RECRUITERS) {
    const member = who(recruiter.handle)
    if (member.me.role !== 'RECRUITER') {
      await admin.put(`/admin/users/${member.me.id}/role`, { role: 'RECRUITER' })
      log(`  rôle Recruteur : ${recruiter.name}`)
    }
  }

  // 3. Questions, réponses, acceptations
  log('\n2. Questions et réponses')
  const existingTitles = new Set((await pages(admin, '/questions?status=ALL')).map((q) => q.title))
  const askers = [...ASKERS]
  const created = []
  for (let i = 0; i < QUESTIONS.length; i++) {
    const question = QUESTIONS[i]
    if (existingTitles.has(question.t)) continue
    const asker = who(askers[i % askers.length].handle)
    const { data: detail } = await asker.client.post('/questions', {
      title: question.t,
      body: question.b,
      code: question.code,
      tags: question.tags,
      context: question.ctx,
    })
    count('questions')
    const answers = []
    for (let k = 0; k < question.a.length; k++) {
      const author = who(CORE[(i + k) % CORE.length].handle)
      const { data: answer } = await author.client.post(`/questions/${detail.id}/answers`, {
        body: question.a[k],
      })
      answers.push({ ...answer, author: author.handle })
      count('réponses')
    }
    await asker.client.put(
      `/questions/${detail.id}/accepted-answer`,
      { answerId: answers[0].id },
      [409],
    )
    count('réponses acceptées')
    created.push({ id: detail.id, askerHandle: asker.handle, answers })
    log(`  + ${question.t}`)
  }

  // 4. Réputation atteinte
  log('\n3. Réputation des membres actifs')
  for (const person of CORE) {
    const me = (await who(person.handle).client.get('/auth/me')).data
    who(person.handle).me = me
    log(`  ${person.name} : ${me.reputation} points, niveau ${me.level}`)
  }
  const voters = CORE.map((p) => who(p.handle)).filter((m) => m.me.level !== 'NEWCOMER')

  // 5. Votes (seulement sur ce qui vient d'être créé : un vote est unique)
  log('\n4. Votes')
  for (const [j, item] of created.entries()) {
    for (const [k, voter] of voters.entries()) {
      if (voter.handle === item.askerHandle || (j + k) % 3 !== 0) continue
      await voter.client.post(`/questions/${item.id}/votes`, { value: 1 }, [403, 409])
      count('votes')
      const target = item.answers.find((a) => a.author !== voter.handle)
      if (target) {
        await voter.client.post(`/answers/${target.id}/votes`, { value: 1 }, [403, 409])
        count('votes')
      }
    }
  }

  async function moderationScenarios() {
    const spammer = who(SPAMMER.handle)
    const spamTargets = (await pages(admin, '/questions?status=ALL')).slice(0, 2)
    const spamAnswers = []
    for (const [i, target] of spamTargets.entries()) {
      const { data: answer } = await spammer.client.post(`/questions/${target.id}/answers`, {
        body: SPAM_ANSWERS[i],
      })
      spamAnswers.push(answer)
      count('réponses')
    }
    const reporters = voters.length >= 5 ? voters : [...voters]
    const report = async (reporter, targetType, targetId, reason, comment) => {
      try {
        const { data } = await reporter.client.post(
          '/reports',
          { targetType, targetId, reason, comment },
          [409],
        )
        count('signalements')
        return data
      } catch (error) {
        warn(`signalement refusé (${error.code ?? error.message})`)
        return null
      }
    }
    let hiddenCase
    for (const reporter of reporters.slice(0, 5)) {
      const receipt = await report(
        reporter,
        'ANSWER',
        spamAnswers[0].id,
        'SPAM',
        'Publicité sans rapport avec la question.',
      )
      if (receipt?.hidden) hiddenCase = receipt.caseId
    }
    if (hiddenCase) {
      await spammer.client.post(
        `/moderation/cases/${hiddenCase}/appeal`,
        {
          message:
            'Ma réponse parle bien de paiement mobile, elle a été masquée par erreur après des signalements groupés.',
        },
        [409],
      )
      count('contestations')
      log('  + réponse masquée automatiquement puis contestée')
    }
    for (const reporter of reporters.slice(0, 3)) {
      await report(
        reporter,
        'ANSWER',
        spamAnswers[1].id,
        'SPAM',
        'Promesse de gains et lien suspect.',
      )
    }
    const rude = who(RUDE.handle)
    const { data: rudeQuestion } = await rude.client.post(
      '/questions',
      {
        title: RUDE_QUESTION.t,
        body: RUDE_QUESTION.b,
        tags: RUDE_QUESTION.tags,
        context: RUDE_QUESTION.ctx,
      },
      [400, 409, 429],
    )
    if (rudeQuestion?.id) {
      for (const reporter of reporters.slice(0, 2))
        await report(
          reporter,
          'QUESTION',
          rudeQuestion.id,
          'OFFENSIVE',
          'Ton agressif envers la communauté.',
        )
    }
    const impostor = who('koffi.mensah')
    await report(
      reporters[0],
      'USER',
      impostor.me.id,
      'IMPERSONATION',
      "Se présente comme employé d'un opérateur sans preuve.",
    )
    const offTopic = created[3]?.answers[1]
    if (offTopic)
      await report(
        reporters[1] ?? reporters[0],
        'ANSWER',
        offTopic.id,
        'OFF_TOPIC',
        'Réponse sans rapport avec la question posée.',
      )
  }

  // 6. Scénarios de modération (une seule fois : seulement quand de nouvelles questions viennent d'être créées)
  log('\n5. Modération')
  if (created.length === 0) log('  déjà en place')
  else await moderationScenarios()
  // 7. Offres : publiées par les recruteurs, validées ou refusées par l'équipe
  log('\n6. Offres')
  const knownJobs = new Map()
  for (const status of ['PENDING', 'PUBLISHED', 'REJECTED']) {
    for (const job of await pages(admin, `/admin/jobs?status=${status}`))
      knownJobs.set(job.title, job)
  }
  for (const job of JOBS) {
    if (knownJobs.has(job.title)) continue
    const { recruiter: recruiterIndex, decision, reason, ...body } = job
    const recruiter = who(RECRUITERS[recruiterIndex].handle)
    const { data } = await recruiter.client.post('/jobs', body)
    count('offres')
    if (decision === 'APPROVE')
      await admin.post(`/admin/jobs/${data.id}/decision`, { decision: 'APPROVE' })
    if (decision === 'REJECT')
      await admin.post(`/admin/jobs/${data.id}/decision`, { decision: 'REJECT', reason })
    log(
      `  + ${job.title}${decision ? ` (${decision === 'APPROVE' ? 'approuvée' : 'refusée'})` : ' (en attente)'}`,
    )
  }

  // 8. Missions et projets
  log('\n7. Missions et projets')
  const missionTitles = new Set((await pages(admin, '/missions?status=OPEN')).map((m) => m.title))
  for (const mission of MISSIONS) {
    if (missionTitles.has(mission.title)) continue
    const { author, ...body } = mission
    await who(author).client.post('/missions', body)
    count('missions')
    log(`  + ${mission.title}`)
  }
  const projectTitles = new Set((await pages(admin, '/projects')).map((p) => p.title))
  for (const project of PROJECTS) {
    if (projectTitles.has(project.title)) continue
    const { author, ...body } = project
    await who(author).client.post('/projects', body)
    count('projets')
    log(`  + ${project.title}`)
  }

  // 9. Défis et dépôts
  log('\n8. Défis')
  const knownChallenges = new Map(
    (await pages(admin, '/admin/challenges')).map((c) => [c.title, c]),
  )
  for (const challenge of CHALLENGES) {
    if (knownChallenges.has(challenge.title)) continue
    const start = new Date(Date.now() + challenge.startOffsetHours * 3_600_000)
    const end = new Date(start.getTime() + challenge.durationDays * 86_400_000)
    const { data } = await admin.post('/admin/challenges', {
      title: challenge.title,
      statement: challenge.statement,
      specifications: challenge.specifications,
      technologies: challenge.technologies,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
    })
    knownChallenges.set(challenge.title, data)
    count('défis')
    log(`  + ${challenge.title}`)
  }
  const current = (await pages(admin, '/admin/challenges?status=OPEN'))[0]
  if (current) {
    let submitted = 0
    for (const { handle, repo } of SUBMISSION_REPOS) {
      const { status } = await who(handle).client.post(
        `/challenges/${current.id}/submissions`,
        {
          repositoryUrl: `https://github.com/${repo}`,
          comment: 'Voici mon dépôt, le README explique comment lancer les tests.',
        },
        [409],
      )
      if (status !== 409) submitted++
    }
    if (submitted > 0) count('dépôts', submitted)
    const pending = await pages(admin, `/admin/challenges/${current.id}/submissions?status=PENDING`)
    if (submitted > 0 && pending.length >= 5) {
      await admin.post(`/admin/submissions/${pending[0].id}/review`, {
        status: 'VALIDATED',
        score: 92,
        feedback: 'Très bon travail, tests complets.',
      })
      await admin.post(`/admin/submissions/${pending[1].id}/review`, {
        status: 'VALIDATED',
        score: 88,
        feedback: 'Solide, documentation à compléter.',
      })
      await admin.post(`/admin/submissions/${pending[2].id}/review`, {
        status: 'REJECTED',
        score: 0,
        feedback: 'Dépôt vide.',
      })
      log('  3 dépôts notés, les autres restent à évaluer')
    }
  } else {
    warn('aucun défi en cours, dépôts ignorés')
  }

  // 10. Communautés et étiquettes
  log('\n9. Communautés et étiquettes')
  const knownCommunities = new Set((await pages(admin, '/admin/communities')).map((c) => c.name))
  for (const community of COMMUNITIES) {
    if (knownCommunities.has(community.name)) continue
    const { data } = await admin.post('/admin/communities', community)
    count('communautés')
    log(`  + ${community.name}`)
    const home = CORE.filter(
      (p) => p.country === community.countryCode || p.tech.includes(community.tag),
    )
    for (const person of home)
      await who(person.handle).client.post(`/communities/${data.slug}/members`, {}, [409])
  }
  for (const name of UNUSED_TAGS) {
    const { status } = await admin.post('/admin/tags', { name }, [409])
    if (status !== 409) count('étiquettes')
  }

  // 11. Tests fermés : publiés par les membres, validés, suspendus ou en attente par l'équipe
  log('\n10. Tests fermés')
  const knownPlaytests = new Set()
  for (const status of ['PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'COMPLETED']) {
    for (const item of await pages(admin, `/admin/playtests?status=${status}`)) {
      knownPlaytests.add(item.campaign.appName)
    }
  }
  for (const test of PLAYTESTS) {
    if (knownPlaytests.has(test.appName)) continue
    const { owner, decision, testers = [], declare = 0, suspend, ...body } = test
    const { data: draft } = await who(owner).client.post('/playtests', body)
    const { data: submitted } = await who(owner).client.post(`/playtests/${draft.id}/submit`)
    count('tests fermés')
    let status = submitted.status
    if (status === 'PENDING_REVIEW' && decision === 'APPROVE') {
      status = (await admin.post(`/admin/playtests/${draft.id}/review`, { decision: 'APPROVE' }))
        .data.status
    }
    if (status === 'ACTIVE') {
      for (const [index, handle] of testers.entries()) {
        await who(handle).client.post(`/playtests/${draft.id}/participations`, {}, [403, 409])
        if (index < declare) {
          await who(handle).client.post(
            `/playtests/${draft.id}/participations/me/confirm`,
            {},
            [400, 409],
          )
        }
        count('participations')
      }
      if (suspend) {
        await admin.post(`/admin/playtests/${draft.id}/suspend`, { note: suspend })
        status = 'SUSPENDED'
      }
    }
    log(`  + ${test.appName} (${status})`)
  }

  log('\nTerminé.')
  for (const [key, value] of Object.entries(stats)) log(`  ${value} ${key}`)
  if (Object.keys(stats).length === 0)
    log('  Rien à créer : les données de démonstration sont déjà en place.')
  log(
    `\nComptes de démonstration : <identifiant>@${MEMBER_DOMAIN}, mot de passe défini par SEED_MEMBER_PASSWORD.`,
  )
}

main().catch((error) => {
  console.error(`\nÉchec : ${error.message}`)
  process.exit(1)
})
