# Zetsu, back office

Back office de Zetsu (modération et administration), servi sous `/admin`.
React 18, Vite, TypeScript, CSS Modules. Les règles de l'équipe sont dans `CLAUDE.md`.
Le design reprend la maquette `zetsu-backoffice.html` : thème vert, clair par défaut, sombre au choix, polices Geist installées par npm.

## Lancer en local

```
cp .env.example .env.local
npm install
npm run dev
```

Le site est sur http://localhost:3200/admin/. Le proxy de Vite renvoie `/api` vers `VITE_API_TARGET`
(`http://localhost:8080` par défaut ; mettre l'adresse du back-end déployé pour travailler sans le lancer).
La session est un cookie : tout passe par la même adresse, donc ni CORS ni jeton à gérer à la main
(`src/api/api.ts` ajoute l'en-tête CSRF sur chaque écriture).

## API

Les types viennent du contrat OpenAPI du back-end : `npm run gen:api` (adresse dans `VITE_API_SPEC`) régénère
`src/api/api-types.ts`. Les appels sont rangés dans `src/api/endpoints.ts`.
`VITE_API_MODE=mock` lit des exemples dans `src/mocks/` (`GET_admin_cases.json`) à la place du back-end.

## Écrans

Connexion, tableau de bord, signalements et contestations, vue Référent, tags, utilisateurs et fiche utilisateur,
offres d'emploi, challenges (liste, notation, création), communautés (liste, création, Référents, propositions).
Accès : Modérateur et Administrateur voient tout, un Référent sans rôle d'équipe n'a que la vue Référent.
Le back-end vérifie les droits à chaque appel ; masquer un écran ne protège rien.

Pas encore d'API côté serveur pour : statistiques du tableau de bord (graphique par jour, délai de réponse),
journal d'audit, paramètres de modération, liste des contenus. Ces écrans de la maquette reviendront avec leurs points d'entrée.

## Scripts

`dev`, `build`, `typecheck`, `lint`, `test`, `format`, `format:check`, `gen:api`.
