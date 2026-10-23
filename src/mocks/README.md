# Données d'exemple

Utilisées quand `VITE_API_MODE=mock`.

- **Sprint 1** (comptes, questions, réponses, votes, profils, tags) : copie exacte des fichiers
  `mocks/` du dépôt back-end (branche du contrat publié). On les recopie à chaque nouveau
  contrat ; on ne les modifie pas ici. Les fichiers `ERROR_*.json` ne sont pas recopiés.
  `GET_auth_me.json` non plus, volontairement : en mode mock, on arrive déconnecté et on se
  connecte avec `POST_auth_login.json` (compte de démo `aminata_dev`).
- **Sprints suivants** (emploi, missions, défis, notifications, modération, IA) : exemples
  provisoires écrits ici, au format des types de `provisional-types.ts`, en attendant leur
  contrat.

Nom d'un fichier : `MÉTHODE_chemin.json`, sans le préfixe `/api/v1`, les identifiants
numériques remplacés par `id` et le pseudo de `/users/{username}` par `username`.

| Appel                        | Fichier                         |
| ---------------------------- | ------------------------------- |
| `GET /questions`             | `GET_questions.json`            |
| `GET /questions/101`         | `GET_questions_id.json`         |
| `GET /questions/101/answers` | `GET_questions_id_answers.json` |
| `POST /questions/101/votes`  | `POST_questions_id_votes.json`  |
| `GET /users/kwame_codes`     | `GET_users_username.json`       |
| `PUT /users/me`              | `PUT_users_me.json`             |
