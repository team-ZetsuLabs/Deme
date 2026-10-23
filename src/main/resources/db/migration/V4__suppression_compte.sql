-- AUTH-6 : un compte supprimé garde sa ligne (questions et réponses restent en place) mais plus aucune donnée
-- personnelle. Son pseudo devient « deleted-<id> », qu'aucune inscription ne peut produire.

alter table users drop constraint users_status_check;
alter table users add constraint users_status_check check (status in ('ACTIVE', 'SUSPENDED', 'DELETED'));
alter table users add column deleted_at timestamptz;
