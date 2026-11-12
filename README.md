# Zetsu : back-end

API de Zetsu (Java 21, Spring Boot 3.5, Spring Security, JPA, Flyway, PostgreSQL 16). Les règles communes de l'équipe sont dans `CLAUDE.md`.

## Démarrer en local

Il faut Java 21 et Docker.

```bash
docker compose -f compose.dev.yaml up -d        # PostgreSQL 16 sur localhost:5432
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run
```

- API : http://localhost:8080/api/v1
- Swagger UI : http://localhost:8080/api/v1/docs
- Contrat OpenAPI : http://localhost:8080/api/v1/openapi.json (copie dans `docs/openapi.json`)

Les variables d'environnement sont décrites dans `.env.example`. Spring ne lit pas le fichier `.env` tout seul : on les exporte dans le terminal ou dans la configuration de lancement de l'IDE.

Pour la connexion GitHub et Google, on ajoute le profil `oauth` (`SPRING_PROFILES_ACTIVE=local,oauth`) et les quatre identifiants. Sans ce profil, seule l'inscription par email est active et `GET /api/v1/auth/providers` renvoie une liste vide.

Pour les photos de profil et les CV, on renseigne `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` et `CLOUDINARY_API_SECRET` (console Cloudinary, rubrique « API Keys »). Sans elles, les fichiers restent sur le disque, dans `UPLOADS_DIR` : c'est le cas en local et dans les tests.

Pour l'assistant IA, on renseigne `AI_API_KEY` (clé Gemini gratuite sur https://aistudio.google.com/apikey). Sans clé, l'assistant répond `503 AI_UNAVAILABLE` et tout le reste marche.

Le profil `demo` abaisse les seuils des niveaux et des badges pour que les privilèges soient visibles pendant la démo (`SPRING_PROFILES_ACTIVE=local,demo`).

Maven doit tourner avec Java 21 : si `java -version` affiche une autre version, on pointe `JAVA_HOME` vers un JDK 21.

## Tests

```bash
./mvnw verify
```

Les tests d'intégration lancent PostgreSQL 16 avec Testcontainers : Docker doit tourner, sinon ils sont ignorés. La suite compte 138 tests ; la CI (`.github/workflows/backend-ci.yml`) la lance sur chaque pull request et sur `main`.

Après un changement de contrat, on régénère `docs/openapi.json` et on le pousse dans la même pull request :

```bash
./mvnw test -Dtest=OpenApiContractTest -DexportOpenApi=true
```

## Ce qui est en place (sprint 1)

| Domaine | Points d'entrée |
| --- | --- |
| `auth` | `GET /auth/csrf`, `GET /auth/providers`, `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, OAuth GitHub et Google |
| `user` | `GET /users/{username}`, `GET /users/{username}/reputation`, `PUT /users/me`, `PUT /users/me/onboarding` (accueil : stack, pays, langue), `DELETE /users/me` (suppression confirmée par le pseudo, contenus anonymisés) |
| `question` | `GET /questions` (recherche plein texte sur titre, détails et étiquettes ; filtres pays, opérateur, réseau, étiquette, auteur, sans solution ; tri), `POST /questions`, `GET /questions/{id}`, `PUT /questions/{id}` |
| `answer` | `GET /questions/{id}/answers`, `POST /questions/{id}/answers`, `PUT /answers/{id}`, `PUT` et `DELETE /questions/{id}/accepted-answer` |
| `comment` | `GET` et `POST /questions/{id}/comments`, `GET` et `POST /answers/{id}/comments`, `DELETE /comments/{id}` (QA-9) ; aussi fournis dans `QuestionDetail.comments` et `Answer.comments` |
| `vote` | `POST` et `DELETE /questions/{id}/votes`, `POST` et `DELETE /answers/{id}/votes` |
| `tag` | `GET /tags` |
| `reputation` | barème dans `ReputationReason`, historique par membre |

## Contrat du sprint 2

Tout est dans Swagger UI et codé. Un point d'entrée publié avant d'être codé répond `501 NOT_IMPLEMENTED` : les fronts utilisent alors les mocks.

Notifications (NOT-1) envoyées : réponse à ma question, réponse acceptée, vote reçu (une fois par votant et par contenu), offre ou mission qui correspond à ma stack, candidature reçue, décision sur une candidature, offre validée ou refusée. Jamais à celui qui agit lui-même.

| Domaine | Points d'entrée |
| --- | --- |
| `job` (codé) | `GET /jobs` (filtres type, pays, technologie ; correspondance avec la stack), `GET /jobs/mine`, `GET /jobs/{id}`, `POST /jobs` (rôle Recruteur, offre en attente), `PUT /jobs/{id}`, `POST /jobs/{id}/close` |
| candidatures (codé) | `POST /jobs/{id}/applications` (multipart : message, CV PDF de 2 Mo), `GET /jobs/{id}/applications`, `POST /missions/{id}/applications`, `GET /missions/{id}/applications`, `PATCH /applications/{id}` (retenir, refuser ; retenir une proposition met la mission en cours), `GET /applications/{id}/cv`, `GET /users/me/applications` (suivi JOB-7) |
| `mission` (codé) | `GET /missions`, `GET /missions/{id}`, `POST /missions`, `PUT /missions/{id}`, `POST /missions/{id}/close` |
| `admin` (codé) | `GET /admin/jobs`, `POST /admin/jobs/{id}/decision` (validation des offres, rôles Modérateur et Administrateur) |
| `notification` (codé) | `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/read` |

Les CV sont rangés dans `UPLOADS_DIR` (par défaut `data/uploads`, ignoré par Git), jamais servis directement : seul `GET /applications/{id}/cv` les rend, au candidat, au recruteur et à l'équipe.

## Contrat du sprint 3

Tout est dans Swagger UI. Un point d'entrée publié avant d'être codé répond `501 NOT_IMPLEMENTED` : les fronts utilisent alors les mocks.

Modération (codée) : un contenu masqué disparaît des listes et renvoie 404 à tous, sauf à son auteur et à l'équipe. Le masquage automatique se déclenche au moment où le seuil est atteint (`zetsu.moderation.auto-hide-threshold`, 5 par défaut). Un contenu qu'un Référent a choisi d'ignorer n'est pas remasqué au signalement suivant : il revient dans la file. Les notifications de modération ne nomment jamais celui qui a décidé.

Back office (codé) : l'équipe peut revenir sur la décision d'un Référent. Pour une contestation, `RESTORE` l'accepte et `HIDE` la rejette. `WARN` et `SUSPEND` masquent aussi le contenu ; `SUSPEND` ferme les sessions de l'auteur dès sa requête suivante. On ne suspend jamais un membre de l'équipe. Un rôle changé compte dès la requête suivante du membre, sans reconnexion. Fusionner deux étiquettes déplace les questions, offres, missions et stacks, sans doublon.

Défis (codés) : un seul défi à la fois, l'équipe ne peut pas en créer deux sur la même période. Un défi qui n'a pas commencé n'est visible que dans le back office. Au début du défi, tous les membres actifs reçoivent `CHALLENGE_STARTED` (vérification chaque minute). Un dépôt validé rapporte +20 une seule fois ; une note corrigée ne change pas les points, et un dépôt refusé après coup les perd. Dans le classement, deux notes égales partagent le même rang.

Photo de profil (codée) : le format est lu dans les premiers octets du fichier, jamais dans son nom. Avec Cloudinary, la photo est publique sur son CDN et `avatarUrl` pointe vers une version recadrée en 256 px au format le plus léger (`f_auto,q_auto`). Sans Cloudinary, les fichiers sont rangés dans `UPLOADS_DIR/avatars` sous un nom régénéré. Les CV vont chez Cloudinary en fichiers privés (`authenticated`) : aucune adresse publique, le serveur les relit par une requête signée pour `GET /applications/{id}/cv`, après les mêmes contrôles d'accès. Les fichiers enregistrés sur le disque avant l'activation de Cloudinary restent lisibles. Une photo n'est servie que tant qu'elle est celle du profil : l'ancienne est effacée quand on en met une nouvelle, quand on la retire, ou quand le compte est supprimé.

Comptes connectés (codés) : `POST /users/me/connections/{provider}` est protégé par CSRF. Il note dans la session que le prochain retour de GitHub ou Google, dans les 10 minutes, doit être rattaché au membre connecté. Le front navigue ensuite vers `authorizationUrl`. Au retour, le serveur renvoie vers `FRONT_URL/settings?linked=github`, ou vers `?linkError=CODE` (`ALREADY_LINKED_ELSEWHERE`, `ALREADY_LINKED`). Un compte externe déjà lié à un autre membre n'est jamais déplacé. On ne délie jamais le dernier moyen de connexion.

| Domaine | Points d'entrée |
| --- | --- |
| `moderation` (codé) | `POST /reports` (MOD-1, niveau Membre ; masquage automatique au 5e signalement, MOD-2), `GET /moderation/cases` (file, niveau Contributeur), `POST /moderation/cases/{id}/decision` (ignorer ou masquer, Référent, MOD-3), `POST /moderation/cases/{id}/appeal` (contestation par l'auteur), `GET /users/me/moderation` (mes contenus masqués) |
| `admin` (MOD-4, codé) | `GET /admin/cases`, `POST /admin/cases/{id}/decision` (ignorer, masquer, rétablir, avertir, suspendre) ; `GET /admin/users`, `POST /admin/users/{id}/suspend`, `POST /admin/users/{id}/reactivate`, `PUT /admin/users/{id}/role` (Administrateur) ; `GET` et `POST /admin/tags`, `POST /admin/tags/{name}/merge`, `DELETE /admin/tags/{name}` ; `GET` et `POST /admin/challenges`, `PUT /admin/challenges/{id}`, `GET /admin/challenges/{id}/submissions`, `POST /admin/submissions/{id}/review` (note sur 100, CH-3) |
| `challenge` (codé) | `GET /challenges/current` (CH-1, avec `serverTime` pour le compte à rebours), `GET /challenges/{id}`, `POST /challenges/{id}/submissions` (lien GitHub public, un par membre, CH-2), `GET /challenges/{id}/leaderboard` |
| `user` (codé) | `PUT /users/me/avatar` (multipart, champ `photo` : PNG, JPG ou WebP de 2 Mo, SET-1), `DELETE /users/me/avatar`, `GET /users/{username}/avatar/{file}` (adresse donnée par `avatarUrl`) ; `GET /users/me/connections`, `POST` et `DELETE /users/me/connections/{provider}` (lier ou délier GitHub et Google, SET-4) |

Nouveaux types de notification : `CONTENT_HIDDEN`, `CONTENT_RESTORED`, `ACCOUNT_WARNED`, `SUBMISSION_REVIEWED`, et la cible `USER`.

## P1 : communautés, assistant IA, questions similaires, badges, projets

Tout est dans Swagger UI et codé.

Communautés (COM-1, COM-2, idée de l'équipe hors cahier) : une communauté réunit un pays ou une technologie ; ses questions sont celles de son pays ou de son étiquette (`GET /questions?community={slug}`). Tout membre peut la rejoindre. Un Référent propose une communauté, l'équipe l'accepte ou la refuse depuis le back office ; une fois acceptée, elle est créée telle quelle et le proposant est notifié (`COMMUNITY_PROPOSAL_DECISION`).

Assistant de rédaction (IA-1) : le serveur envoie le brouillon au fournisseur et ne garde de la réponse que ce qui entre dans le format attendu : un titre de 15 à 150 caractères, des étiquettes valides marquées existantes ou nouvelles, un contexte (pays ISO, opérateur, réseau) pris dans les listes connues, et des informations manquantes choisies dans une liste fermée que le front traduit (`ERROR_MESSAGE`, `CODE`, `TECH_VERSION`, `EXPECTED_RESULT`, `ATTEMPTS`, `ENVIRONMENT`). Les consignes et le texte du membre voyagent dans deux blocs séparés, le texte étant envoyé comme une valeur JSON : une tentative d'injection ne change ni la forme ni les valeurs de la réponse. Aucune donnée du compte n'est envoyée et les adresses email du texte sont masquées. 10 appels par membre et par heure, cache de 24 heures (table `ai_suggestions`, clé SHA-256 du brouillon, sans identifiant de membre), 7 secondes au plus. Le fournisseur est derrière l'interface `AiProvider` : Gemini aujourd'hui (palier gratuit, modèle réglable par `AI_MODEL`), remplaçable sans toucher au reste.

Questions similaires (QA-8) : plein texte en français et en anglais. Un titre en cours de saisie est rarement complet, on ne demande donc pas tous ses mots : une question doit partager au moins deux mots utiles avec le titre (ou le seul, s'il n'y en a qu'un), et le classement se fait par nombre de mots partagés puis par pertinence. Un mot vide dans l'une des deux langues est écarté (le texte étant indexé dans les deux, « que » deviendrait sinon un mot utile en anglais), ainsi que les mots interrogatifs présents dans la moitié des titres (« comment », « how »…).

Badges (REP-4) : Premier pas (une question ou une réponse), Entraide (réponses publiées), Résolveur (réponses acceptées), Challenger (dépôts de défi validés), Polyglotte (étiquettes différentes avec une réponse acceptée ou votée), Aide locale (réponses à des questions d'autres membres de son pays). Les compteurs sont recalculés depuis les contenus visibles après chaque réponse et chaque gain de réputation, jamais tenus à la main. Seuils dans `zetsu.badges` (10, 5, 1, 3, 5), abaissés par le profil `demo` (3, 2, 1, 2, 2). Un badge gagné ne se perd pas.

Espace Projets (PRJ-1 à PRJ-6) : un projet a de 1 à 6 rôles, un membre par rôle, soit 7 personnes au plus avec le porteur, sous la limite de 8 de la section 5.2. Un projet est `OPEN` tant qu'un rôle est ouvert, `IN_PROGRESS` quand tous sont pourvus, `PAUSED` après 60 jours sans activité de l'équipe (vérification chaque heure ; la prochaine action du porteur ou d'un membre le relance), `CLOSED` à la clôture. Une demande est `PENDING`, `ACCEPTED`, `REFUSED` ou `LEFT` (départ ou retrait avec un motif, que le membre retrouve sur sa demande). Accepter une demande refuse les autres demandes en attente sur ce rôle. À la clôture, chaque membre accepté gagne 10 points, une seule fois ; le porteur n'en gagne pas, pour qu'un projet ouvert et clôturé seul ne rapporte rien. Les liens de dépôt et de contact n'acceptent que `https://github.com/…` et `http(s)://…`. Pas de messagerie interne : les échanges passent par le lien de contact.

| Domaine | Points d'entrée |
| --- | --- |
| `community` | `GET /communities`, `GET /communities/{slug}`, `POST` et `DELETE /communities/{slug}/members`, `GET /users/me/communities`, `POST /community-proposals` (niveau Référent), `GET /users/me/community-proposals` |
| `admin` (communautés) | `GET` et `POST /admin/communities`, `PUT /admin/communities/{slug}`, `PUT /admin/communities/{slug}/referents`, `POST /admin/communities/{slug}/close` et `/reopen`, `GET /admin/community-proposals`, `POST /admin/community-proposals/{id}/decision` |
| `ai` | `POST /ai/question-assist` (IA-1) |
| `question` | `GET /questions/similar?title=&exclude=&limit=` (QA-8, publique, de 1 à 10 résultats) |
| `question` | `POST /questions/images` (QA-11, multipart `image`, PNG/JPG/WebP de 2 Mo au plus) puis `imageIds` (2 au plus) dans `POST` et `PUT /questions` ; `QuestionDetail.images` |
| `reputation` | `GET /users/{username}/badges` (les six badges et la progression) ; champ `badges` du profil public (badges gagnés) |
| `project` | `GET` et `POST /projects`, `GET` et `PUT /projects/{id}`, `POST /projects/{id}/roles`, `DELETE /projects/{id}/roles/{roleId}`, `POST /projects/{id}/close`, `POST` et `GET /projects/{id}/requests`, `PATCH` et `DELETE /projects/{id}/requests/{requestId}`, `POST /projects/{id}/leave`, `POST /projects/{id}/members/{username}/remove`, `GET` et `POST /projects/{id}/updates`, `GET /users/me/project-requests` |

Nouveaux types de notification : `COMMUNITY_PROPOSAL_DECISION`, `PROJECT_REQUEST_RECEIVED`, `PROJECT_REQUEST_DECIDED`, `PROJECT_MEMBER_REMOVED`, `PROJECT_CLOSED`, et la cible `PROJECT`. Un projet se signale avec `targetType: PROJECT`.

## Tests fermés Google Play (TST, idée de l'équipe hors cahier)

Conception complète : `docs/conception-tests-fermes.md`. Un développeur doit réunir 12 testeurs pendant 14 jours avant de publier sur Google Play ; Zetsu organise l'entraide. Google ne donne aucune API pour lire la liste des testeurs : rien n'est vérifié automatiquement, et chaque compteur affiche son niveau de preuve (`DECLARED` par le testeur, `VERIFIED` par le porteur dans la Play Console, `COMPLETED` après les 14 jours).

Une campagne naît en `DRAFT`, puis passe `ACTIVE` tout de suite si le porteur a 50 points ou plus, sinon `PENDING_REVIEW` jusqu'à la décision de l'équipe (`REJECTED` avec un motif, corrigeable). L'équipe peut la suspendre (`SUSPENDED`) ; elle devient `COMPLETED` quand toutes les places ont tenu 14 jours, ou à la clôture par le porteur. Une seule campagne en cours par application. Rejoindre prend une place sous verrou de la campagne ; l'installation se déclare sous 48 heures, sinon la place se libère et sera reprise par le suivant. Le lien d'inscription au test n'est donné qu'après avoir rejoint. Une tâche horaire envoie les rappels (installation, « toujours inscrit », fin proche), termine les participations arrivées au bout (+5 de réputation, `PLAYTEST_COMPLETED`) et efface les adresses Google 30 jours après la fin.

| Domaine | Points d'entrée |
| --- | --- |
| `playtest` | `GET` et `POST /playtests`, `GET /playtests/mine`, `GET` et `PUT /playtests/{id}`, `PUT /playtests/{id}/icon`, `POST /playtests/{id}/submit`, `POST /playtests/{id}/close`, `GET` et `POST /playtests/{id}/participations`, `POST /playtests/{id}/participations/me/confirm`, `/check-in` et `/withdraw`, `POST /playtests/{id}/participations/{participationId}/verify` et `/remove`, `GET /users/me/playtest-participations` |
| `admin` (tests fermés) | `GET /admin/playtests?status&problem=INACTIVE\|STALLED\|REPORTED`, `GET /admin/playtests/stats`, `POST /admin/playtests/{id}/review`, `/suspend` et `/reactivate`, `GET /admin/playtests/{id}/participations`, `POST /admin/playtests/{id}/participations/{participationId}/remove`, `GET /admin/playtests/{id}/events` |

Nouveaux types de notification : `PLAYTEST_NEW_CAMPAIGN`, `PLAYTEST_JOINED`, `PLAYTEST_INSTALL_REMINDER`, `PLAYTEST_STAY_REMINDER`, `PLAYTEST_ENDING_SOON`, `PLAYTEST_PARTICIPATION_DONE`, `PLAYTEST_TESTER_LEFT`, `PLAYTEST_TESTER_REPLACED`, `PLAYTEST_CAMPAIGN_FULL`, `PLAYTEST_CAMPAIGN_REVIEWED`, `PLAYTEST_REMOVED`, et la cible `PLAYTEST`. Une campagne se signale avec `targetType: PLAYTEST`.

## Données de démo

Les scripts de `seed/` remplissent une base avec des membres, des questions, des réponses, des communautés, des badges, des projets et des photos de profil dessinées, tous réalistes et africains. Le compte du jury n'a ni email ni mot de passe dans le dépôt : ils sont passés en variables au lancement. Ordre, commandes et scénarios de démo : `seed/README.md`.

Les `operationId` sont stables, de la forme `<domaine><Méthode>` (`questionList`, `jobApply`, `jobAdminDecide`).

Un exemple de réponse par point d'entrée se trouve dans `mocks/` (`GET_questions.json`, `GET_questions_id.json`…), plus quelques erreurs types (`ERROR_*.json`).

## Session et CSRF, côté front

1. Au démarrage, `GET /api/v1/auth/csrf` pose le cookie `XSRF-TOKEN` (lisible en JavaScript).
2. Chaque `POST`, `PUT`, `PATCH`, `DELETE` renvoie sa valeur dans l'en-tête `X-XSRF-TOKEN`.
3. Le jeton change après la connexion : on relit le cookie avant chaque requête plutôt que de le garder en mémoire.
4. La session est le cookie `JSESSIONID` (HttpOnly, Secure, SameSite=Lax), valable 30 jours.
5. Pour OAuth, on navigue vers `authorizationUrl` (pas de `fetch`) ; le serveur renvoie ensuite vers `FRONT_URL`.

## Choix à connaître

- Le Markdown est rendu par commonmark puis nettoyé par jsoup (liste blanche). Le HTML brut écrit par un membre est échappé, les images sont retirées (poids en 3G et pistage), seuls les liens `http` et `https` passent et reçoivent `rel="nofollow noopener noreferrer"`.
- Un compte GitHub ou Google n'est jamais rattaché automatiquement à un compte email existant, même avec la même adresse : l'email d'inscription n'est pas vérifié, ce serait une porte ouverte au vol de compte.
- La limitation de débit est en mémoire (une seule instance). Les sessions aussi : un redémarrage déconnecte tout le monde.
- Les compteurs des badges et la recherche des questions similaires sont faits en SQL (`BadgeService`, `QuestionSearch`) : pas de compteur à tenir à jour, pas de service de recherche externe.
- Les migrations Flyway ne se modifient jamais une fois fusionnées ; la dernière est `V17__tests_fermes.sql` (V16, suppression des questions, arrive avec la PR #24 et doit être fusionnée avant).
