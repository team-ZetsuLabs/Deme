# Zetsu, back office

Back office de Zetsu (modération et administration), servi sous `/admin`.
React 18, Vite, TypeScript. Les règles de l'équipe sont dans `CLAUDE.md`.

## Lancer en local

```
cp .env.example .env.local
npm install
npm run dev
```

Le site est sur http://localhost:3200/admin/. Le proxy de Vite renvoie `/api` vers `localhost:8080`.

## Scripts

`dev`, `build`, `typecheck`, `lint`, `test`, `format`, `format:check`, `gen:api`.
