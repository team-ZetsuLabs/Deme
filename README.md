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

## Contrat du sprint 2 (publié, pas encore codé)

Ces points d'entrée sont dans Swagger UI et répondent `501 NOT_IMPLEMENTED` tant qu'ils ne sont pas codés : les fronts utilisent les mocks.

| Domaine | Points d'entrée |
| --- | --- |
| `job` | `GET /jobs` (filtres type, pays, technologie ; correspondance avec la stack), `GET /jobs/mine`, `GET /jobs/{id}`, `POST /jobs` (rôle Recruteur, offre en attente), `PUT /jobs/{id}`, `POST /jobs/{id}/close` |
| candidatures | `POST /jobs/{id}/applications` (multipart : message, CV PDF de 2 Mo), `GET /jobs/{id}/applications`, `POST /missions/{id}/applications`, `GET /missions/{id}/applications`, `PATCH /applications/{id}` (retenir, refuser), `GET /applications/{id}/cv`, `GET /users/me/applications` (suivi JOB-7) |
| `mission` | `GET /missions`, `GET /missions/{id}`, `POST /missions`, `PUT /missions/{id}`, `POST /missions/{id}/close` |
| `admin` | `GET /admin/jobs`, `POST /admin/jobs/{id}/decision` (validation des offres, rôles Modérateur et Administrateur) |
| `notification` | `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/read` |

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
