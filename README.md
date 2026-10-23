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

Le site est sur http://localhost:3200/admin/. Le proxy de Vite renvoie `/api` vers `localhost:8080`.
Tant que l'API n'est pas branchée (`VITE_API_MODE=mock`), les écrans affichent des données de démonstration
et la connexion en deux étapes accepte n'importe quelle adresse email valide, un mot de passe et un code à 6 chiffres.

## Écrans

Tableau de bord, signalements, vue Référent, contenus, tags, utilisateurs et fiche utilisateur, offres d'emploi,
challenges (liste et création), journal d'audit, paramètres. Français et anglais, thème clair et sombre.

## Scripts

`dev`, `build`, `typecheck`, `lint`, `test`, `format`, `format:check`, `gen:api`.
