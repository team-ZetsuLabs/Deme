-- QA-3 : l'auteur supprime sa question tant que personne n'y a répondu. La ligne reste (masquée) pour garder la
-- trace des signalements ; plus aucun point d'entrée ne la sert.

alter table questions add column deleted_at timestamptz;
