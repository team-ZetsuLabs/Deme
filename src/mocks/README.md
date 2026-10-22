# Données d'exemple

Copie des fichiers `mocks/` du dépôt back-end, utilisée quand `VITE_API_MODE=mock`.
On les recopie à chaque contrat publié par Salif ; on ne les invente pas ici.

Nom d'un fichier : `MÉTHODE_chemin.json`, sans le préfixe `/api/v1`, les identifiants
numériques remplacés par `id`.

| Appel | Fichier |
| --- | --- |
| `GET /questions` | `GET_questions.json` |
| `GET /questions/12` | `GET_questions_id.json` |
| `POST /questions/12/answers` | `POST_questions_id_answers.json` |
