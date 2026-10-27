# Données de démonstration

Script rejouable qui remplit une instance de Zetsu avec du contenu réaliste et africain : membres de plusieurs pays,
40 questions environ avec réponses acceptées et votes, scénarios de modération (spam masqué automatiquement puis contesté,
signalements en attente, profil usurpé), offres d'emploi (approuvées, refusées, en attente dont une arnaque), missions, projets,
défis avec dépôts notés ou à évaluer, communautés et étiquettes inutilisées.

Tout passe par l'API (jamais par la base) : la réputation, les niveaux, le masquage automatique et les notifications
suivent donc les vraies règles. Un compte, une question ou une offre déjà présents sont reconnus et sautés.

## Utilisation

Il faut un compte administrateur existant.

```
SEED_API_URL=https://hackathon-backend-pw2o.onrender.com \
SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... \
npm run seed
```

| Variable                                  | Rôle                                          | Défaut                  |
| ----------------------------------------- | --------------------------------------------- | ----------------------- |
| `SEED_API_URL`                            | adresse du back-end                           | `http://localhost:8080` |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | compte administrateur (obligatoire)           | aucun                   |
| `SEED_MEMBER_PASSWORD`                    | mot de passe des comptes de démonstration     | `zetsu2026demo`         |
| `SEED_MEMBER_DOMAIN`                      | domaine des adresses email créées             | `exemple.com`           |
| `SEED_PAUSE_MS`                           | pause entre deux appels (limitation de débit) | `400`                   |

Les comptes sont `<identifiant>@exemple.com` (par exemple `aminata.diallo@exemple.com`). Le compte administrateur n'est jamais écrit ici.
Le script attend et réessaie quand le serveur répond 429 ou met du temps à se réveiller.

Les votes et les scénarios de modération ne sont créés que lors de la première exécution : un vote ou un signalement est unique par membre.
