# Zetsu : instructions communes de l'équipe

Ce fichier est lu par chaque membre de l'équipe et par son assistant Claude. Il fixe ce qui doit être identique pour tout le monde. En cas de doute, on suit ce fichier ; s'il est faux ou incomplet, on le corrige par une pull request relue, jamais en local.

Le détail des fonctionnalités et du planning est dans le cahier des charges (onglets « Cahier des charges » et « Répartition du travail »). Ce fichier n'en reprend que ce qui sert à coder.

## Le projet

- **Zetsu** : plateforme d'échange africaine pour les développeurs. Entraide (questions et réponses), emploi et missions entre pairs, défis, réputation, modération communautaire.
- **Concours** : CADev 2026 de Systalink. Livrables : dépôt Git et démo en ligne.
- **Dates** : gel des fonctionnalités le 11 novembre au soir, soumission le 14 novembre, échéance le 15 novembre 2026.
- **Ce qui nous distingue** : le contexte africain sur chaque question (pays, opérateur mobile money, qualité du réseau), un site léger qui marche en 3G, la modération par des membres de confiance (Référents).

## Qui fait quoi

Chaque projet a son propre dépôt Git. **Ce dépôt ne contient que le back office.**

| Projet | Dépôt | Responsable | Couvre |
| --- | --- | --- | --- |
| Back-end | dépôt du back-end | Salif | Tout le Java : base, API, sécurité côté serveur, OAuth, assistant IA |
| Site web | `PetitBlack/Hackathon_Web` | Benhasser | Tous les écrans des membres, langues, PWA ; vidéo et pitch |
| Back office | ce dépôt | Rimvie | Signalement, vue Référent, back office ; déploiement, données de démo, README, soumission |
| Renfort | `PetitBlack/Hackathon_Web` | Cédric (plus tard) | Rejoint le site web : emploi, missions, défis, puis espace Projets |

Règle d'or : **on ne modifie que son propre dépôt**. Pour un changement dans le dépôt d'un autre, on ouvre une issue ou on lui demande.

## Pile technique (figée, ne pas en changer sans accord de l'équipe)

- **Back-end** : Java 21, Spring Boot 3, Spring Security (client OAuth2 GitHub et Google), Spring Data JPA, Flyway, PostgreSQL 16.
- **Authentification** : session par cookie HttpOnly, Secure, SameSite=Lax, avec jeton CSRF. **Pas de JWT.** Inscription par email en secours d'OAuth.
- **Recherche** : plein texte PostgreSQL (`tsvector`, français et anglais). Pas d'Elasticsearch.
- **Front (site web et back office)** : React 18 avec Vite, en TypeScript (fichiers `.tsx` et `.ts`, pas de `.js` dans `src/`). Chaque application vit à la racine de son propre dépôt, sans workspaces npm ni paquet commun.
  - Navigation : React Router. Le back office est servi sous `/admin` (option `base: '/admin/'` de Vite).
  - Traductions : react-i18next.
  - PWA : site web uniquement, pas dans le back office.
  - Styles : CSS Modules (`Bouton.module.css`) qui utilisent les variables de `tokens.css`. Pas de Tailwind, pas de bibliothèque de composants (MUI, Chakra, shadcn…), pas de CSS-in-JS.
  - État : état local et contexte React (session, thème, langue). Pas de Redux ni de Zustand.
  - Appels réseau : uniquement via `src/api/api.ts`. Pas d'axios, pas de `fetch` éparpillé dans les composants.
- **Service des fronts** : en production, Caddy sert les fichiers construits du site web et du back office (sous `/admin`), et transmet `/api` à Spring Boot. Tout est sur la même adresse, donc pas de CORS et la session par cookie marche telle quelle. En local, le proxy de Vite renvoie `/api` vers `localhost:8080`.
- **Infrastructure** : Docker Compose (application, PostgreSQL, Caddy pour le HTTPS). Chaque dépôt a sa CI GitHub Actions qui vérifie sa pull request ; le déploiement de `main` est géré par Rimvie.
- **Documentation de l'API** : OpenAPI, visible dans Swagger UI.
- **IA** : toujours derrière l'interface `AiProvider` côté serveur. La clé d'API ne quitte jamais le serveur.

Avant d'ajouter une dépendance (Maven ou npm), on demande dans le groupe. Aucune bibliothèque chargée depuis un CDN : tout passe par npm et le build, pour que la démo marche même avec un réseau capricieux.

## Organisation du dépôt

Organisation de ce dépôt (back office), calquée sur celle du site web :

```
package.json        scripts : dev, build, typecheck, lint, test, format, format:check, gen:api
.github/workflows/  ci.yml : format, types, lint, tests et build sur chaque pull request
src/
  api/              api.ts (bascule mock ou live, CSRF, erreurs), api-types.ts (généré, ne pas modifier)
  components/       composants communs : Button, Avatar, Dialog, Field, MemberContent…
  features/         logique par domaine : reports, referent, moderation, users, jobs…
  hooks/            hooks transverses
  i18n/             fr.json, en.json, configuration de react-i18next
  layout/           structure des écrans du back office
  mocks/            copie des réponses d'exemple du back-end, une par point d'entrée
  pages/            une page par dossier : pages/reports/ReportsPage.tsx
  styles/           tokens.css (couleurs, espacements, typo), base.css
infra/              docker-compose.yml, Caddyfile, scripts de sauvegarde (s'ils vivent dans ce dépôt)
seed/               script et données de démo (s'ils vivent dans ce dépôt)
```

Le back-end (avec `mocks/`) et le site web sont dans les dépôts des autres projets.

### Conventions React

- Composants en fonctions, un composant par fichier, nom en PascalCase identique au fichier (`ReportCard.tsx`).
- Les hooks maison commencent par `use` et vivent dans le dossier du domaine (`features/reports/useReports.ts`).
- Chaque page découpée en `React.lazy` pour charger les écrans à la demande.
- Chaque appel réseau gère trois états visibles : chargement, erreur (message traduit à partir du `code`), liste vide.
- ESLint (règles `react-hooks` et `typescript-eslint` incluses) et Prettier, configurés à la racine. La CI échoue si le format, le lint, la vérification des types (`npm run typecheck`), les tests ou le build échouent.

### Conventions TypeScript

- `strict` désactivé au départ, mais `noImplicitAny` et `strictNullChecks` activés. On pourra durcir plus tard s'il reste du temps.
- **Trois choses toujours typées** : les réponses de l'API (types générés), les props des composants de `src/components/`, et `api.ts`. Le reste peut être typé au minimum.
- Les types de l'API viennent **uniquement** de `src/api/api-types.ts`, généré par `npm run gen:api` (openapi-typescript sur le Swagger du back-end). On ne recopie jamais un type d'API à la main.
- Quand Salif publie un changement de contrat, il prévient les deux fronts, qui relancent `npm run gen:api` chacun dans leur dépôt. Si un écran casse, la CI le dit avant la fusion.
- `any` est interdit (règle ESLint) ; si on ne sait vraiment pas, `unknown` puis une vérification. `// @ts-ignore` est interdit ; `// @ts-expect-error` est toléré avec une phrase qui explique pourquoi.
- Props en `type` (pas `interface`), nommées `<Composant>Props` : `type ReportCardProps = { report: Report }`.

### Partage entre applications

- Le site web et le back office sont dans deux dépôts : il n'y a pas de paquet commun. Chaque front garde sa copie des composants et de `tokens.css`. Un changement qui doit valoir pour les deux (couleur, espacement, composant de sécurité comme `MemberContent`) est signalé à l'autre front.

Côté back-end, le code est rangé **par domaine**, pas par couche : `auth`, `user`, `question`, `answer`, `vote`, `reputation`, `job`, `mission`, `notification`, `moderation`, `challenge`, `ai`. Chaque domaine contient son contrôleur, son service, son dépôt et ses DTO.

## Le contrat d'API (la règle qui évite que le back-end bloque tout le monde)

1. Salif publie dans Swagger UI les points d'entrée du sprint suivant **avant** de les coder : chemin, méthode, JSON d'entrée, JSON de sortie, erreurs possibles.
2. Pour chaque point d'entrée, un fichier d'exemple est ajouté dans `mocks/` du dépôt back-end (par exemple `mocks/GET_reports.json`). Chaque front le recopie dans son `src/mocks/` et régénère ses types dans `src/api/api-types.ts` (`npm run gen:api`).
3. Le site web et le back office codent sur ces exemples. `src/api/api.ts` bascule entre les exemples et la vraie API avec une variable d'environnement Vite (`VITE_API_MODE=mock` ou `live`, dans `.env.local`).
4. Une fois publié, un contrat ne change plus sans prévenir les deux fronts. Un champ ajouté, ça va. Un champ renommé ou retiré, il faut leur accord.

Dates de gel du contrat : sprint 1 le 22 octobre, sprint 2 le 27 octobre, sprint 3 le 3 novembre.

### Conventions de l'API

- Préfixe : `/api/v1`. Ressources au pluriel, en anglais, en kebab-case : `/api/v1/questions/{id}/answers`.
- JSON en camelCase. Dates en ISO 8601, en UTC.
- Pagination : `?page=0&size=20`, réponse `{ "items": [...], "page": 0, "size": 20, "total": 134 }`.
- Erreurs, toujours de la même forme :
  ```json
  { "code": "QUESTION_NOT_FOUND", "message": "Question introuvable", "fields": { "title": "Obligatoire" } }
  ```
  `code` est stable et sert au front pour traduire. `fields` n'existe que pour les erreurs de validation.
- Codes HTTP : 400 validation, 401 non connecté, 403 interdit, 404 introuvable, 409 conflit (déjà voté…), 429 trop d'appels.
- Toute requête qui modifie quelque chose (POST, PUT, PATCH, DELETE) envoie l'en-tête CSRF. `api.ts` s'en charge, on ne le refait pas à la main.

## Sécurité (non négociable, le jury regardera)

- **Aucun secret dans Git.** Les clés vont dans `.env`, ignoré par Git. On maintient `.env.example` à jour avec des valeurs factices.
- Le Markdown des membres est **nettoyé côté serveur** (liste blanche de balises). Côté front, React échappe le texte tout seul : on affiche les contenus en `{texte}`, jamais autrement.
- `dangerouslySetInnerHTML` est **interdit partout**, sauf dans le composant `MemberContent`, qui repasse le HTML par DOMPurify avant de l'afficher. Pour afficher un contenu de membre mis en forme (contenu signalé, par exemple), on utilise ce composant et rien d'autre.
- Pas d'URL de lien venant d'un membre sans vérifier qu'elle commence par `https://` ou `http://` (sinon `javascript:` passe).
- Les écrans du back office ne sont qu'un affichage : les droits (Référent, administrateur) sont vérifiés par le back-end à chaque appel, jamais seulement en masquant un bouton.
- Pas de `eval`, pas de `new Function`, pas de script inline : la politique de sécurité du contenu (CSP) de Caddy les bloque.
- Les téléversements (CV, photo) sont vérifiés par type réel et par taille, et stockés hors du dossier public.
- Limitation de débit sur la connexion, la publication et l'assistant IA.
- Le compte de démonstration est créé par le script de `seed/`, jamais en dur dans le code.

## Design et interface

On reprend le style des maquettes validées : mode clair par défaut, mode sombre au choix, mémorisé. Toutes les couleurs, tailles et espacements viennent de `src/styles/tokens.css`, qui reste identique à celui du site web. On ne tape jamais une couleur en dur dans un fichier de page.

Ce qu'on **ne fait pas**, sur aucun écran :

- pas de dégradé violet ou bleu, pas de texte en dégradé, pas de grain sur dégradé ;
- pas de glassmorphism ;
- pas d'emoji dans les titres ;
- pas d'Inter partout, pas de Space Grotesk avec Instrument Serif, pas d'italique serif pour faire un effet ;
- pas de cartes à bordure colorée sur un côté, pas de rangée de trois cartes avec une icône chacune, pas de petit badge au-dessus du titre ;
- pas d'icônes Lucide partout, pas de composants shadcn sans retouche ;
- pas d'apparition en fondu au défilement, pas de traînée derrière le curseur, pas de boutons qui s'estompent au survol ;
- pas de mode sombre sans contraste suffisant ;
- pas d'espacements au hasard : uniquement les valeurs de `tokens.css` ;
- pas de tiret cadratin dans les textes, pas de jargon marketing.

Ce qu'on **fait** :

- conception mobile d'abord : tout doit marcher à 360 px de large, sans défilement horizontal ;
- avatar avec initiales quand le membre n'a pas de photo (composant `Avatar`) ;
- contraste AA minimum, focus visible au clavier, chaque champ a son libellé ;
- des pages légères : objectif Lighthouse performance ≥ 80 et accessibilité ≥ 90, en 3G simulée.

## Langues

- Français et anglais dès le départ. Aucun texte d'interface écrit en dur dans le JSX : tout passe par `t('reports.list.title')` de react-i18next, avec les textes dans `src/i18n/fr.json` et `en.json` et des clés par écran.
- On ajoute la clé dans les **deux** fichiers en même temps. S'il manque la traduction anglaise, on recopie le français et on ajoute `"TODO"` dans un commentaire de la pull request.
- Le contenu des membres n'est pas traduit.

## Git et pull requests

- `main` est toujours déployable ; personne ne pousse directement dessus.
- Une branche par tâche, nommée `<projet>/<identifiant>-<sujet>` : `backend/QA-1-questions`, `web/AUTH-5-onboarding`, `backoffice/MOD-4-offres`.
- Chaque branche part de `main` à jour (`git switch main`, `git pull`, puis `git switch -c …`). Pas de branches empilées : une branche ne part jamais d'une autre branche non fusionnée.
- Avant de pousser : `npm run format`, puis `git rebase origin/main` si `main` a avancé. Pour récupérer le travail d'un autre, on attend qu'il soit fusionné puis on fait `git pull` sur `main`.
- Fusion en « Squash and merge » : une pull request devient un seul commit sur `main`, et la branche est supprimée après la fusion.
- Messages de commit courts au présent, préfixés : `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`. On cite l'identifiant du cahier : `feat(MOD-4): file des offres signalées`.
- **Petites pull requests**, fusionnées chaque jour. Une branche ouverte depuis plus de 2 jours est un signal d'alerte à signaler.
- Qui relit qui : le back-end est relu par Rimvie, le site web par Rimvie, le back office par Salif ou Benhasser. La CI doit être verte avant la fusion.
- Les migrations Flyway ne se modifient jamais une fois fusionnées : on en ajoute une nouvelle (`V12__ajout_missions.sql`).

## Identifiants et priorités

Chaque fonctionnalité a un identifiant dans le cahier des charges (AUTH, QA, REP, JOB, PRJ, IA, CH, NOT, MOD, SET ; R pour les idées en réserve). On les cite dans les branches, les commits et les issues.

- **P0** : obligatoire pour la démo. On ne commence pas un P1 tant qu'un P0 de son projet est ouvert.
- **P1** : assistant IA (IA-1), questions similaires, badges, espace Projets (seulement quand Cédric est là).
- **P2 et idées en réserve** : on n'y touche pas avant le 11 novembre, et seulement si tout le P0 est en ligne sans bug bloquant.

## Tests et qualité

- Back-end : tests d'intégration sur les services et les contrôleurs principaux (Testcontainers avec PostgreSQL). Chaque correction de bug vient avec un test qui le reproduit.
- Front : Vitest et React Testing Library pour `api.ts`, `MemberContent` et les formulaires importants ; pas de quête de couverture sur le reste. On teste chaque écran à 360 px et sur ordinateur, en mode clair et sombre, en français et en anglais, avant de demander une relecture.
- Contenus piégés : chaque formulaire est essayé avec `<script>alert(1)</script>` et `<img src=x onerror=alert(1)>`. Rien ne doit s'exécuter.

## Données de démo

Les données de démo sont réalistes et africaines : vrais pays, vraies villes, opérateurs mobile money existants, prénoms variés, questions qui ressemblent à de vraies questions de développeurs. Pas de « Lorem ipsum », pas de « Test 1 ». Elles sont rejouables à volonté par le script de `seed/`.

## Pour l'assistant Claude de chaque membre

- Lis ce fichier en entier avant de proposer du code. Respecte la pile, les dossiers et les conventions ci-dessus, même si une autre solution te semble meilleure. Propose-la à l'humain plutôt que de l'appliquer.
- Dans ce dépôt, tout relève du back office (Rimvie). Ne touche pas aux dépôts des autres projets ; pour un besoin côté back-end ou site web, propose une issue à la personne concernée.
- Ne change jamais un contrat d'API publié sans le signaler clairement.
- Ne mets jamais de secret, de clé ou de mot de passe dans un fichier suivi par Git.
- Quand une décision manque ici, demande à l'humain et propose d'ajouter la réponse à ce fichier.
