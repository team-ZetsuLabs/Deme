-- Cache de l'assistant de rédaction (IA-1) : 24 heures, pour économiser le quota du fournisseur.
-- La clé est une empreinte SHA-256 du texte envoyé : aucun identifiant de membre n'est stocké.
create table ai_suggestions (
    cache_key  char(64)    primary key,
    response   text        not null,
    created_at timestamptz not null default now()
);

create index ai_suggestions_created_at_idx on ai_suggestions (created_at);
