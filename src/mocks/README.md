# Données d'exemple

Utilisées quand `VITE_API_MODE=mock`.

- **Contrat publié** (comptes, questions, emploi, missions, défis, notifications, modération,
  communautés) : copie exacte des fichiers `mocks/` du dépôt back-end. On les recopie à chaque
  nouveau contrat ; on ne les modifie pas ici. Les fichiers `ERROR_*.json` ne sont pas recopiés.
  `GET_auth_me.json` non plus, volontairement : en mode mock, on arrive déconnecté et on se
  connecte avec `POST_auth_login.json` (compte de démo `aminata_dev`).
- **Points d'entrée pas encore publiés** (assistant IA, commentaires, statistiques de l'accueil,
  classement par pays, mot de passe oublié, vérification de l'email) : exemples provisoires
  écrits ici, au format des types de `provisional-types.ts`.

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
