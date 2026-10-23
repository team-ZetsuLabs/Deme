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

## Tests

```bash
./mvnw verify
```

Les tests d'intégration lancent PostgreSQL 16 avec Testcontainers : Docker doit tourner, sinon ils sont ignorés.

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

| Domaine | Points d'entrée |
| --- | --- |
| `moderation` (codé) | `POST /reports` (MOD-1, niveau Membre ; masquage automatique au 5e signalement, MOD-2), `GET /moderation/cases` (file, niveau Contributeur), `POST /moderation/cases/{id}/decision` (ignorer ou masquer, Référent, MOD-3), `POST /moderation/cases/{id}/appeal` (contestation par l'auteur), `GET /users/me/moderation` (mes contenus masqués) |
| `admin` (MOD-4) | `GET /admin/cases`, `POST /admin/cases/{id}/decision` (ignorer, masquer, rétablir, avertir, suspendre) ; `GET /admin/users`, `POST /admin/users/{id}/suspend`, `POST /admin/users/{id}/reactivate`, `PUT /admin/users/{id}/role` (Administrateur) ; `GET` et `POST /admin/tags`, `POST /admin/tags/{name}/merge`, `DELETE /admin/tags/{name}` ; `GET` et `POST /admin/challenges`, `PUT /admin/challenges/{id}`, `GET /admin/challenges/{id}/submissions`, `POST /admin/submissions/{id}/review` (note sur 100, CH-3) |
| `challenge` | `GET /challenges/current` (CH-1, avec `serverTime` pour le compte à rebours), `GET /challenges/{id}`, `POST /challenges/{id}/submissions` (lien GitHub public, un par membre, CH-2), `GET /challenges/{id}/leaderboard` |
| `user` | `PUT /users/me/avatar` (multipart, champ `photo` : PNG, JPG ou WebP de 2 Mo, SET-1), `DELETE /users/me/avatar`, `GET /users/{username}/avatar/{file}` (adresse donnée par `avatarUrl`) ; `GET /users/me/connections`, `POST` et `DELETE /users/me/connections/{provider}` (lier ou délier GitHub et Google, SET-4) |

Nouveaux types de notification : `CONTENT_HIDDEN`, `CONTENT_RESTORED`, `ACCOUNT_WARNED`, `SUBMISSION_REVIEWED`, et la cible `USER`.

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
